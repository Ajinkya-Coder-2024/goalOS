import axios from 'axios';

const API_URL = 'http://localhost:5000/api/life-plans';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Set auth header
const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const getLifePlans = async () => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data.data;
};

export const createLifePlan = async (planData: {
  startAge: number;
  endAge: number;
  targetYear: number;
  description: string;
}) => {
  const response = await axios.post(API_URL, planData, getAuthHeader());
  return response.data.data;
};

export const updateLifePlan = async (
  id: string,
  planData: {
    startAge?: number;
    endAge?: number;
    targetYear?: number;
    description?: string;
    completed?: boolean;
    completedAt?: string | null;
  }
) => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    planData,
    getAuthHeader()
  );
  return response.data.data;
};

export const deleteLifePlan = async (id: string) => {
  await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return id;
};

export const getPlansByYearRange = async (startYear: number, endYear: number) => {
  const response = await axios.get(
    `${API_URL}/range/${startYear}/${endYear}`,
    getAuthHeader()
  );
  return response.data.data;
};
