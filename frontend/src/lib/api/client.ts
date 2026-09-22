import { getApiUrl } from '../config/api';

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

const isAdminApiPath = (path: string) =>
  /(^\/admin(?:\/|$))|(?:\/admin(?:\/|$))/.test(path);

type AuthMode = 'auto' | 'admin' | 'user' | 'either' | 'public';

type ApiRequestOptions = RequestInit & {
  authMode?: AuthMode;
};

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
  isNetworkError?: boolean;
}

const isApiError = (error: unknown): error is ApiError =>
  error instanceof Error && ('status' in error || 'data' in error);

const apiClient = {
  async request<T>(
    method: string,
    path: string,
    data?: unknown,
    options?: ApiRequestOptions,
    retries = MAX_RETRIES
  ): Promise<{ data: T; token?: string }> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = getApiUrl();
    
    // Construct URL. If baseUrl is relative (/api), Next.js handles proxying.
    const url = baseUrl.startsWith('http') 
      ? `${baseUrl}${normalizedPath}`
      : `${normalizedPath.startsWith(baseUrl) ? '' : baseUrl}${normalizedPath}`;
    
    const isFormData = data instanceof FormData;

    const onAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const resolvedAuthMode =
      options?.authMode ??
      (isAdminApiPath(normalizedPath)
        ? 'admin'
        : normalizedPath.includes('/upload')
          ? 'either'
          : 'user');

    const headers = new Headers(
      isFormData
        ? { ...options?.headers }
        : {
          'Content-Type': 'application/json',
          ...options?.headers,
        }
    );

    let usedTokenType: 'admin' | 'user' | null = null;

    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('adminAccessToken');
      const userToken = localStorage.getItem('accessToken');

      if (resolvedAuthMode === 'admin') {
        if (adminToken) headers.append('Authorization', `Bearer ${adminToken}`);
        usedTokenType = 'admin';
      } else if (resolvedAuthMode === 'either') {
        const token = onAdminPage ? adminToken || userToken : userToken || adminToken;
        if (token) headers.append('Authorization', `Bearer ${token}`);
        usedTokenType = onAdminPage
          ? adminToken
            ? 'admin'
            : userToken
              ? 'user'
              : null
          : userToken
            ? 'user'
            : adminToken
              ? 'admin'
              : null;
      } else if (resolvedAuthMode === 'user') {
        if (userToken) headers.append('Authorization', `Bearer ${userToken}`);
        usedTokenType = userToken ? 'user' : null;
      } else if (resolvedAuthMode === 'public') {
        // Deliberately do not attach either browser token to a public request.
      } else {
        const token = userToken || adminToken;
        if (token) headers.append('Authorization', `Bearer ${token}`);
        usedTokenType = userToken ? 'user' : adminToken ? 'admin' : null;
      }
    }

    const { authMode: _authMode, ...fetchOptions } = options ?? {};
    const config: RequestInit = {
      ...fetchOptions,
      method,
      headers,
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    };

    try {
      const response = await fetch(url, config);
      const token = response.headers.get('Authorization')?.split(' ')[1];

      if (response.status === 401) {
        const unauthorizedError = new Error('Unauthorized') as ApiError;
        unauthorizedError.status = 401;

        // Public endpoints must remain usable on login/public pages. A 401
        // from an explicitly public request is returned to the caller and
        // never starts an authentication redirect.
        if (resolvedAuthMode !== 'public' && typeof window !== 'undefined') {
          const isAdminRequest = resolvedAuthMode === 'admin' || usedTokenType === 'admin';
          const currentPathIsAdmin = window.location.pathname.startsWith('/admin');

          if (usedTokenType === 'admin' || isAdminRequest) {
            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('currentAdminUser');
          }
          if (usedTokenType === 'user' || resolvedAuthMode === 'user') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('currentUser');
          }

          const loginPath = currentPathIsAdmin || isAdminRequest ? '/admin/login' : '/login';
          const currentUrl = window.location.pathname + window.location.search;
          const isAlreadyOnLoginPage = window.location.pathname === loginPath;

          if (!isAlreadyOnLoginPage) {
            window.location.replace(`${loginPath}?redirect=${encodeURIComponent(currentUrl)}`);
          }
        }

        throw unauthorizedError;
      }

      const responseText = await response.text();

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { 
            message: responseText || `HTTP error! Status: ${response.status}`,
            raw: responseText
          };
        }
        
        console.error(`API Error for ${method} ${normalizedPath}:`, errorData);
        
        const errorRecord = typeof errorData === 'object' && errorData !== null
          ? errorData as { message?: unknown; error?: unknown }
          : undefined;
        const errorMessage = errorRecord?.message || errorRecord?.error || `HTTP error! Status: ${response.status}`;
        const error = new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)) as ApiError;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      if (response.status === 204 || !responseText) {
        return { data: undefined as T, token };
      }

      try {
        const responseBody = JSON.parse(responseText);
        const responseData = responseBody.data !== undefined ? responseBody.data : responseBody;
        return { data: responseData, token };
      } catch (parseError) {
        return { data: responseText as unknown as T, token };
      }

    } catch (error: unknown) {
      const apiError = isApiError(error) ? error : undefined;
      const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
      console.error(`API request failed for ${method} ${normalizedPath}:`, errorMessage);

      const isNetworkError = error instanceof TypeError || errorMessage === 'Failed to fetch';
      if (isNetworkError && apiError) apiError.isNetworkError = true;
      const status = apiError?.status;
      const isUserError = typeof status === 'number' && status >= 400 && status < 500;
      
      if (retries > 0 && !isUserError && !isNetworkError) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return this.request(method, normalizedPath, data, options, retries - 1);
      }
      if (isNetworkError && !apiError) {
        const networkError = new Error(errorMessage) as ApiError;
        networkError.isNetworkError = true;
        throw networkError;
      }
      throw error;
    }
  },

  get<T>(path: string, options?: ApiRequestOptions): Promise<{ data: T; token?: string }> {
    return this.request<T>('GET', path, undefined, options);
  },

  post<T>(path: string, data: unknown, options?: ApiRequestOptions): Promise<{ data: T; token?: string }> {
    return this.request<T>('POST', path, data, options);
  },

  put<T>(path: string, data: unknown, options?: ApiRequestOptions): Promise<{ data: T; token?: string }> {
    return this.request<T>('PUT', path, data, options);
  },

  patch<T>(path: string, data: unknown, options?: ApiRequestOptions): Promise<{ data: T; token?: string }> {
    return this.request<T>('PATCH', path, data, options);
  },

  delete<T>(path: string, options?: ApiRequestOptions): Promise<{ data: T; token?: string }> {
    return this.request<T>('DELETE', path, undefined, options);
  },
};

export default apiClient;
export { apiClient };
