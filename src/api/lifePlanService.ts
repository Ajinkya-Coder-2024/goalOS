import axios from 'axios';

const API_URL = 'http://localhost:5000/api/life-plans';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export type LifePlanPayload = {
  goal: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  detailItems: string[];
  completed?: boolean;
};

export const getLifePlans = async () => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data.data;
};

export const createLifePlan = async (planData: LifePlanPayload) => {
  console.debug('[lifePlanService] createLifePlan payload:', JSON.stringify(planData, null, 2));
  const response = await axios.post(API_URL, planData, getAuthHeader());
  console.debug('[lifePlanService] createLifePlan response:', response.data);
  return response.data.data;
};

export const updateLifePlan = async (
  id: string,
  planData: Partial<LifePlanPayload> & {
    completed?: boolean;
    completedAt?: string | null;
  }
) => {
  console.debug('[lifePlanService] updateLifePlan payload:', JSON.stringify(planData, null, 2));
  const response = await axios.put(
    `${API_URL}/${id}`,
    planData,
    getAuthHeader()
  );
  console.debug('[lifePlanService] updateLifePlan response:', response.data);
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
