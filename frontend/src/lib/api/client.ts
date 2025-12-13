
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
      // - Upload paths: use admin token if admin is logged in, else user token
      // - Other paths: use user token
      let token: string | null = null;
      if (path.startsWith('/admin')) {
        token = adminToken;
        usedTokenType = 'admin';
      } else if (path.includes('/upload') || path.includes('/upload/')) {
        // Prefer user token for uploads if available, otherwise fall back to admin
        token = userToken || adminToken;
        usedTokenType = userToken ? 'user' : (adminToken ? 'admin' : null);
      } else {
        token = userToken;
        usedTokenType = 'user';
      }

      if (token) {
        console.log(`Attaching token for ${path}`, { isAdmin: usedTokenType === 'admin', isUpload: path.includes('/upload') });
        headers.append('Authorization', `Bearer ${token}`);
      } else {
        console.log(`No token found for ${path}`);
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
        console.log("Received 401 Unauthorized. Clearing tokens and redirecting to login.");
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
        const shouldRedirect =
          (onAdminPage && isAdminRequest) || (!isAdminRequest && !onAdminPage);

        if (shouldRedirect && window.location.pathname !== loginPath) {
          window.location.href = `${loginPath}?redirect=${encodeURIComponent(redirectUrl)}`;
        }

        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        console.error(`API Error for ${method} ${path}:`, errorData);
        // The backend wraps errors in a `message` property.
        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const responseText = await response.text();
      if (response.status === 204 || !responseText) {
        return { data: undefined as T, token };
      }

      const responseBody = JSON.parse(responseText);
      const responseData = responseBody.data !== undefined ? responseBody.data : responseBody;

      console.log(`API Success for ${method} ${path}:`, { responseData, token });
      return { data: responseData, token };

    } catch (error) {
      console.error(`API request failed for ${method} ${path}:`, error);
      if (retries > 0) {
        console.log(`Retrying... (${retries} retries left)`);
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
