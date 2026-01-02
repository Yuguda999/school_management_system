import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  public api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private authErrorCallback: (() => void) | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Don't add auth token for login endpoints only
        const isLoginEndpoint = config.url?.includes('/auth/login') ||
          config.url?.includes('/auth/student/login') ||
          (config.url?.includes('/auth/school/') && config.url?.includes('/student/login'));

        console.log('🔍 Request interceptor:', {
          url: config.url,
          isLoginEndpoint,
          hasAuthHeader: !!config.headers.Authorization
        });

        if (!isLoginEndpoint) {
          const token = localStorage.getItem('access_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Added auth token for non-login endpoint');
          }
        } else {
          console.log('🚫 Skipping auth token for login endpoint');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        console.log('🔍 Response interceptor error:', {
          url: originalRequest.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });

        // Don't attempt token refresh for authentication endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/') || originalRequest.url?.includes('/login');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            // If we're already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token } = response.data;
            localStorage.setItem('access_token', access_token);

            // Process the failed queue
            this.processQueue(null, access_token);

            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and trigger auth error callback
            this.processQueue(refreshError, null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Trigger auth error callback if set (e.g., to logout user)
            if (this.authErrorCallback) {
              this.authErrorCallback();
            }

            // Token refresh failed, tokens cleared
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log('API Service POST:', url);
    console.log('POST data:', data);
    console.log('POST data type:', typeof data);
    console.log('POST data keys:', data ? Object.keys(data) : 'no data');

    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }

  // Method to set authentication error callback
  setAuthErrorCallback(callback: (() => void) | null) {
    this.authErrorCallback = callback;
  }

  // Method to clear authentication error callback
  clearAuthErrorCallback() {
    this.authErrorCallback = null;
  }
}

export const apiService = new ApiService();
