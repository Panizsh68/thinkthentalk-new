
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
    const url = `${getApiUrl()}${path}`;
    console.log(`API Request: ${method} ${url}`, { data });

    const isFormData = data instanceof FormData;

    const headers = new Headers(
      isFormData
        ? { ...options?.headers }  // FormData: don't set Content-Type, let browser handle it
        : {
          'Content-Type': 'application/json',
          ...options?.headers,
        }
    );

    let usedTokenType: 'admin' | 'user' | null = null;

    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('adminAccessToken');
      const userToken = localStorage.getItem('accessToken');

      // Token selection logic:
      // - Admin paths: use admin token
      // - Other paths: use user token
      let token: string | null = null;
      if (path.startsWith('/admin')) {
        token = adminToken;
        usedTokenType = 'admin';
      } else if (path.includes('/upload') || path.includes('/upload/')) {
        token = userToken || adminToken;
        usedTokenType = userToken ? 'user' : (adminToken ? 'admin' : null);
      } else {
        token = userToken;
        usedTokenType = 'user';
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

      console.log(`API Response Status for ${method} ${path}:`, response.status);

      if (response.status === 401 && typeof window !== 'undefined') {
        const isAdminRequest = path.startsWith('/admin') || usedTokenType === 'admin';
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

      if (!response.ok) {
        let errorData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => null);
        } else {
          const text = await response.text().catch(() => 'No response body');
          errorData = { message: text || `HTTP error! Status: ${response.status}` };
        }
        
        console.error(`API Error for ${method} ${path}:`, errorData);
        
        const errorMessage = errorData?.message || `HTTP error! Status: ${response.status}`;
        const error: any = new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const responseText = await response.text();
      if (response.status === 204 || !responseText) {
        return { data: undefined as T, token };
      }

      try {
        const responseBody = JSON.parse(responseText);
        const responseData = responseBody.data !== undefined ? responseBody.data : responseBody;
        return { data: responseData, token };
      } catch (parseError) {
        console.error('Failed to parse successful response as JSON:', responseText);
        return { data: responseText as unknown as T, token };
      }

    } catch (error: any) {
      console.error(`API request failed for ${method} ${path}:`, error.message || error);
      if (retries > 0 && error.status !== 401 && error.status !== 400 && error.status !== 404 && error.status !== 403) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return this.request(method, path, data, options, retries - 1);
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
