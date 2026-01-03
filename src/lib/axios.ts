import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const errorResponse = error.response?.data || {};
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data ? JSON.parse(error.config.data) : null,
      responseData: errorResponse,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
    
    console.error('API Error Details:', JSON.stringify(errorDetails, null, 2));
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // If the server returned an error message, use it
    const errorMessage = errorResponse.message || 
                        errorResponse.error || 
                        'An unexpected error occurred';
    
    // Create a new error with the server's message
    const apiError = new Error(errorMessage);
    
    // Attach additional error details
    (apiError as any).status = error.response?.status;
    (apiError as any).data = errorResponse;
    
    return Promise.reject(apiError);
  }
);

// Helper function for making API requests with better TypeScript support
const apiRequest = async <T = any>({
  method = 'get',
  url,
  data,
  params,
  headers,
}: {
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  url: string;
  data?: any;
  params?: any;
  headers?: any;
}): Promise<T> => {
  try {
    const response = await api.request<T>({
      method,
      url,
      data,
      params,
      headers: {
        ...api.defaults.headers,
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

export { apiRequest, api as default };
