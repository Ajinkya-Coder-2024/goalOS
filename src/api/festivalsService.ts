import axios from 'axios';

const API_URL = 'http://localhost:5000/api/festivals';

const getAuthToken = () => localStorage.getItem('token');
const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` },
});

export type BucketItemDTO = {
  _id: string;
  label: string;
  price?: number;
  completed?: boolean;
};

export type FestivalDTO = {
  _id: string;
  name: string;
  description?: string;
  items: BucketItemDTO[];
};

export const getFestivals = async (): Promise<FestivalDTO[]> => {
  const res = await axios.get(API_URL, getAuthHeader());
  return res.data;
};

export const createFestival = async (data: { name: string; description?: string }): Promise<FestivalDTO> => {
  const res = await axios.post(API_URL, data, getAuthHeader());
  return res.data;
};

export const addBucketItem = async (
  festivalId: string,
  data: { label: string; price?: number }
): Promise<FestivalDTO> => {
  const res = await axios.post(`${API_URL}/${festivalId}/items`, data, getAuthHeader());
  return res.data;
};

export const updateBucketItem = async (
  festivalId: string,
  itemId: string,
  data: { label?: string; price?: number; completed?: boolean }
): Promise<FestivalDTO> => {
  const res = await axios.put(`${API_URL}/${festivalId}/items/${itemId}`, data, getAuthHeader());
  return res.data;
};

export const deleteBucketItem = async (
  festivalId: string,
  itemId: string
): Promise<FestivalDTO> => {
  const res = await axios.delete(`${API_URL}/${festivalId}/items/${itemId}`, getAuthHeader());
  return res.data;
};
