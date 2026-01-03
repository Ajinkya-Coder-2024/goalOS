import axios from 'axios';

const API_URL = 'http://localhost:5000/api/challenges';

// Set up axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Subject {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  progress?: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  resources?: Array<{
    title: string;
    url: string;
    type: 'video' | 'article' | 'document' | 'other';
  }>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  fieldType?: 'description' | 'date' | 'none';
}

export interface Challenge {
  _id?: string;
  userId?: string;
  name: string;
  description?: string;
  subjects?: Subject[];
  status?: 'active' | 'completed' | 'paused';
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create a new challenge
export const createChallenge = async (challengeData: Omit<Challenge, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Challenge> => {
  try {
    const response = await api.post<{ data: Challenge }>('/', challengeData);
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating challenge:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create challenge');
  }
};

// Get all challenges for the current user
export const getChallenges = async (): Promise<Challenge[]> => {
  try {
    const response = await api.get<{ data: Challenge[] }>('/');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching challenges:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch challenges');
  }
};

// Get a single challenge by ID
export const getChallenge = async (id: string): Promise<Challenge> => {
  try {
    const response = await api.get<{ data: Challenge }>(`/${id}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching challenge:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch challenge');
  }
};

// Update an existing challenge
export const updateChallenge = async (id: string, challengeData: Partial<Challenge>): Promise<Challenge> => {
  try {
    const response = await api.put<{ data: Challenge }>(`/${id}`, challengeData);
    return response.data.data;
  } catch (error: any) {
    console.error('Error updating challenge:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update challenge');
  }
};

// Delete a challenge
export const deleteChallenge = async (id: string | { _id?: string; id?: string }): Promise<void> => {
  try {
    // Handle case where id might be an object
    const challengeId = typeof id === 'string' ? id : id?._id || id?.id;
    
    if (!challengeId) {
      throw new Error('No valid challenge ID provided');
    }
    
    // Ensure the ID is a string and properly encoded
    const response = await api.delete(`/${encodeURIComponent(challengeId.toString())}`);
    return response.data;
  } catch (error: any) {
    console.error('Error in deleteChallenge:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete challenge');
  }
};

// Section related API calls
export interface SectionResponse {
  _id: string;
  name: string;
  description?: string;
  order: number;
  progress: number;
  subjects?: Subject[];
}

export interface AddSubjectData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  fieldType?: 'description' | 'date' | 'none';
}

export interface UpdateSubjectData {
  name?: string;
  description?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  progress?: number;
  startDate?: string;
  endDate?: string;
  fieldType?: 'description' | 'date' | 'none';
  resources?: Array<{
    title: string;
    url: string;
    type: 'video' | 'article' | 'document' | 'other';
  }>;
}

export const addSection = async (challengeId: string, sectionData: { name: string }): Promise<SectionResponse> => {
  try {
    const response = await api.post<{ data: SectionResponse }>(`/${challengeId}/sections`, sectionData);
    return response.data.data;
  } catch (error: any) {
    console.error('Error in addSection:', {
      message: error.message,
      response: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers
      }
    });
    throw new Error(error.response?.data?.message || 'Failed to add section');
  }
};

export const updateSection = async (challengeId: string, sectionId: string, sectionData: { name: string }): Promise<SectionResponse> => {
  try {
    const response = await api.put<{ data: SectionResponse }>(`/${challengeId}/sections/${sectionId}`, sectionData);
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update section');
  }
};

export const deleteSection = async (challengeId: string, sectionId: string): Promise<void> => {
  try {
    await api.delete(`/${challengeId}/sections/${sectionId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete section');
  }
};

/**
 * Add a single subject to a section
 */
export const addSubject = async (
  challengeId: string,
  sectionId: string,
  subjectData: AddSubjectData
): Promise<Subject> => {
  try {
    const response = await api.post<{ data: Subject }>(
      `/${challengeId}/sections/${sectionId}/subjects`,
      subjectData
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to add subject');
  }
};

/**
 * Add multiple subjects to a section in a single request
 */
export const addMultipleSubjects = async (
  challengeId: string,
  sectionId: string,
  subjects: AddSubjectData[]
): Promise<Subject[]> => {
  try {
    const response = await api.post<{ data: Subject[] }>(
      `/${challengeId}/sections/${sectionId}/subjects/batch`,
      { subjects }
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to add subjects');
  }
};

/**
 * Update a subject in a section
 */
export const updateSubject = async (
  challengeId: string,
  sectionId: string,
  subjectId: string,
  subjectData: UpdateSubjectData
): Promise<Subject> => {
  try {
    const response = await api.put<{ data: Subject }>(
      `/${challengeId}/sections/${sectionId}/subjects/${subjectId}`,
      subjectData
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error updating subject:', error.response?.data?.message || error.message);
    console.error('Error details:', {
      challengeId,
      sectionId,
      subjectId,
      subjectData,
      error: error.response?.data || error.message
    });
    throw new Error(error.response?.data?.message || 'Failed to update subject');
  }
};

/**
 * Delete a subject from a section
 */
export const deleteSubject = async (
  challengeId: string,
  sectionId: string,
  subjectId: string
): Promise<void> => {
  try {
    await api.delete(`/${challengeId}/sections/${sectionId}/subjects/${subjectId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete subject');
  }
};

export default {
  createChallenge,
  getChallenges,
  getChallenge,
  updateChallenge,
  deleteChallenge,
};
