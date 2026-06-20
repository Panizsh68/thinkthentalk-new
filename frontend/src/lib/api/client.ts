import { getApiUrl } from '../config/api';

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

const apiClient = {
  async request<T>(
    method: string,
    path: string,
    data?: any,
    options?: RequestInit,
    retries = MAX_RETRIES
  ): Promise<{ data: T; token?: string }> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = getApiUrl();
    const url = baseUrl === '/api' ? `/api${normalizedPath}` : `${baseUrl}${normalizedPath}`;
    
    console.log(`API Request: ${method} ${url}`);

    const isFormData = data instanceof FormData;

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

      let token: string | null = null;
      if (normalizedPath.startsWith('/admin')) {
        token = adminToken;
        usedTokenType = 'admin';
      } else if (normalizedPath.includes('/upload')) {
        token = userToken || adminToken;
        usedTokenType = userToken ? 'user' : (adminToken ? 'admin' : null);
      } else {
        token = userToken;
        usedTokenType = userToken ? 'user' : null;
      }

      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }
    }

    const config: RequestInit = {
      method,
      headers,
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const token = response.headers.get('Authorization')?.split(' ')[1];

      if (response.status === 401 && typeof window !== 'undefined') {
        const isAdminRequest = normalizedPath.startsWith('/admin') || usedTokenType === 'admin';
        const onAdminPage = window.location.pathname.startsWith('/admin');

        if (isAdminRequest || usedTokenType === 'admin') {
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('currentAdminUser');
        }

        if (usedTokenType === 'user') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('currentUser');
        }

        const loginPath = onAdminPage || isAdminRequest ? '/admin/login' : '/login';
        const redirectUrl = window.location.pathname + window.location.search;
        
        if (window.location.pathname !== loginPath) {
          window.location.href = `${loginPath}?redirect=${encodeURIComponent(redirectUrl)}`;
        }

        throw new Error('Unauthorized');
      }

      const responseText = await response.text();

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          // Capturing raw text to prevent {} being logged
          errorData = { message: responseText || `HTTP error! Status: ${response.status}` };
        }
        
        console.error(`API Error for ${method} ${normalizedPath}:`, errorData);
        
        const errorMessage = errorData?.message || errorData?.error || `HTTP error! Status: ${response.status}`;
        const error: any = new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
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

    } catch (error: any) {
      console.error(`API request failed for ${method} ${normalizedPath}:`, error.message);
      
      const isNetworkError = error.message === 'Failed to fetch';
      const isUserError = error.status >= 400 && error.status < 500;
      
      if (retries > 0 && !isUserError && !isNetworkError) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return this.request(method, normalizedPath, data, options, retries - 1);
      }
      throw error;
    }
  },

  get<T>(path: string, options?: RequestInit): Promise<{ data: T; token?: string }> {
    return this.request<T>('GET', path, undefined, options);
  },

  post<T>(path: string, data: any, options?: RequestInit): Promise<{ data: T; token?: string }> {
    return this.request<T>('POST', path, data, options);
  },

  put<T>(path: string, data: any, options?: RequestInit): Promise<{ data: T; token?: string }> {
    return this.request<T>('PUT', path, data, options);
  },

  patch<T>(path: string, data: any, options?: RequestInit): Promise<{ data: T; token?: string }> {
    return this.request<T>('PATCH', path, data, options);
  },

  delete<T>(path: string, options?: RequestInit): Promise<{ data: T; token?: string }> {
    return this.request<T>('DELETE', path, undefined, options);
  },
};

export default apiClient;
export { apiClient };
