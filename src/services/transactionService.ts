import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to set the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token being sent:', token);
    } else {
      console.warn('No token found in localStorage - redirecting to login');
      // Redirect to login if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
      return Promise.reject(new Error('No authentication token found'));
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication error - Token might be invalid or expired');
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired&redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
    return Promise.reject(error);
  }
);

export interface Transaction {
  _id?: string;
  type: 'earning' | 'expense';
  amount: number;
  description: string;
  date: string | Date;
  category?: string;
  completed?: boolean;
}

export interface TransactionSummary {
  earnings: number;
  expenses: number;
  transactionCount: number;
}

export const createTransaction = async (transactionData: Omit<Transaction, '_id'>) => {
  const response = await api.post('/transactions', transactionData);
  return response.data;
};

export const getTransaction = async (id: string) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

export const getTransactions = async (month?: number, year?: number, type?: 'earning' | 'expense') => {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());
  if (type) params.append('type', type);
  
  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data;
};

export const getTransactionSummary = async (month?: number, year?: number) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());
  
  const response = await api.get(`/transactions/summary?${params.toString()}`);
  // The backend returns { success: true, data: { earnings, expenses, transactionCount } }
  return response.data.data;
};

export const updateTransaction = async (id: string, transactionData: Partial<Transaction>) => {
  try {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return { data: response.data };
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const response = await api.delete(`/transactions/${id}`);
    return { data: response.data };
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const markTransactionAsCompleted = async (id: string, isCompleted: boolean) => {
  try {
    // Get the current transaction to preserve all fields
    const current = await getTransaction(id);
    
    // Update the transaction with the completed status
    const response = await updateTransaction(id, {
      ...current,
      completed: isCompleted
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error updating transaction completion status:', error);
    throw error;
  }
};
