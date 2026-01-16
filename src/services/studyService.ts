import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create study-structure-specific axios instance
const studyStructureApi = axios.create({
  baseURL: `${API_URL}/study-structure`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create study-materials-specific axios instance
const studyMaterialApi = axios.create({
  baseURL: `${API_URL}/study-materials`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
const addAuthHeader = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(addAuthHeader);
studyStructureApi.interceptors.request.use(addAuthHeader);
studyMaterialApi.interceptors.request.use(addAuthHeader);

// Response interceptor for error handling
const handleResponseError = (error) => {
  if (error.response?.status === 401) {
    // Handle unauthorized - redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

api.interceptors.response.use(response => response, handleResponseError);
studyStructureApi.interceptors.response.use(response => response, handleResponseError);
studyMaterialApi.interceptors.response.use(response => response, handleResponseError);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Study Branches
export const getStudyBranches = async () => {
  try {
    console.log('Fetching branches from API...');
    // First, get the branches with subjects
    const response = await studyStructureApi.get('/');
    console.log('Raw API response:', response);
    
    let branches;
    
    // Handle different response formats
    if (response.data && Array.isArray(response.data)) {
      console.log('Response is an array, using directly');
      branches = response.data;
    } else if (response.data?.data?.branches) {
      console.log('Found branches in response.data.data.branches');
      branches = response.data.data.branches;
    } else if (response.data?.branches) {
      console.log('Found branches in response.data.branches');
      branches = response.data.branches;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      console.log('Found branches in response.data.data');
      branches = response.data.data;
    } else {
      console.warn('Unexpected response format from getStudyBranches:', response.data);
      branches = [];
    }
    
    console.log('Processed branches:', branches);
    return branches;
    
  } catch (error) {
    console.error('Error fetching study branches:', error);
    throw error;
  }
};

export const createStudyBranch = async (branchData) => {
  const response = await studyStructureApi.post('/branches', branchData);
  // Backend returns { success: true, data: branch }
  // Return the actual branch object
  return response.data?.data || response.data;
};

export const updateStudyBranch = async (id, branchData) => {
  const response = await studyStructureApi.put(`/branches/${id}`, branchData);
  return response.data;
};

export const deleteStudyBranch = async (id) => {
  await studyStructureApi.delete(`/branches/${id}`);
  return id;
};

// Subjects
export const addSubject = async (branchId, subjectData) => {
  const response = await studyStructureApi.post(`/branches/${branchId}/subjects`, subjectData);
  return response.data;
};

// Note: These endpoints might need to be implemented in the backend
// export const updateSubject = async (branchId, subjectId, subjectData) => {
//   const response = await studyStructureApi.put(`/branches/${branchId}/subjects/${subjectId}`, subjectData);
//   return response.data;
// };

// export const deleteSubject = async (branchId, subjectId) => {
//   await studyStructureApi.delete(`/branches/${branchId}/subjects/${subjectId}`);
//   return subjectId;
// };

// Statistics
export const getStudyStatistics = async () => {
  // This endpoint needs to be implemented in the backend
  // For now, we'll return mock data
  return {
    totalBranches: 0,
    activeBranches: 0,
    completedBranches: 0,
    totalSubjects: 0
  };
  // Once implemented, uncomment the following:
  // const response = await api.get('/study/statistics');
  // return response.data;
};

// Study Materials
export interface StudyMaterial {
  _id?: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'link' | 'document' | 'other';
  url: string;
  subjectId: string;
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define a custom error type for API errors
class ApiError extends Error {
  status?: number;
  response?: any;
  
  constructor(message: string, status?: number, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
    
    // This is needed for TypeScript when extending built-in classes
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Add a new study material
export const addStudyMaterial = async (materialData: Omit<StudyMaterial, '_id' | 'createdAt' | 'updatedAt'>) => {
  const { subjectId, branchId, url, type = 'document', title, description = '' } = materialData;
  
  // Map 'link' type to 'website' to match backend enum
  const backendType = type === 'link' ? 'website' : type;
  
  const requestData = {
    title,
    description,
    link: url,
    type: backendType
  };

  console.log('Adding study material with data:', {
    ...requestData,
    branchId,
    subjectId
  });

  try {
    // Use the studyStructureApi instead of studyMaterialApi
    const response = await studyStructureApi.post<StudyMaterial>(
      `/branches/${branchId}/subjects/${subjectId}/materials`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500 // Only reject on server errors
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('Study material added successfully:', response.data);
      return response.data;
    } else {
      // If we get here, the request failed but didn't throw an error
      const errorData = response.data as any;
      const errorMessage = errorData?.message || 'Failed to add study material';
      throw new ApiError(errorMessage, response.status, response.data);
    }
  } catch (error: any) {
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    if (error.isAxiosError) {
      // Handle Axios errors
      const axiosError = error as import('axios').AxiosError;
      
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const responseData = axiosError.response.data as any;
        console.error('Error response data:', responseData);
        console.error('Error status:', axiosError.response.status);
        
        const errorMessage = responseData?.message || 
                           responseData?.error || 
                           `Request failed with status ${axiosError.response.status}`;
        
        throw new ApiError(errorMessage, axiosError.response.status, responseData);
      } else if (axiosError.request) {
        // The request was made but no response was received
        console.error('No response received:', axiosError.request);
        throw new Error('No response received from server');
      }
    }
    
    // If we get here, it's not an Axios error
    console.error('Error:', error.message);
    throw error;
  }
};

// Get study materials by subject
export const getStudyMaterialsBySubject = async (subjectId: string): Promise<StudyMaterial[]> => {
  // This endpoint needs to be implemented in the backend
  // For now, return an empty array
  return [];
  // Once implemented, uncomment the following:
  // const response = await studyMaterialApi.get(`/subject/${subjectId}`);
  // return response.data;
};

// Get study materials by branch
export const getStudyMaterialsByBranch = async (branchId: string): Promise<StudyMaterial[]> => {
  // This endpoint needs to be implemented in the backend
  // For now, return an empty array
  return [];
  // Once implemented, uncomment the following:
  // const response = await studyMaterialApi.get(`/branch/${branchId}`);
  // return response.data;
};

// Update a study material
export const updateStudyMaterial = async (id: string, materialData: Partial<StudyMaterial>): Promise<StudyMaterial> => {
  // This endpoint needs to be implemented in the backend
  // For now, just return the input data as if it was updated
  return { ...materialData, _id: id } as StudyMaterial;
  // Once implemented, uncomment the following:
  // const response = await studyMaterialApi.put(`/${id}`, materialData);
  // return response.data;
};

// Delete a study material
export const deleteStudyMaterial = async (id: string): Promise<string> => {
  // This endpoint needs to be implemented in the backend
  // For now, just return the ID as if it was deleted
  return id;
  // Once implemented, uncomment the following:
  // await studyMaterialApi.delete(`/${id}`);
  // return id;
};

export default {
  getStudyBranches,
  createStudyBranch,
  updateStudyBranch,
  deleteStudyBranch,
  addSubject,
  getStudyStatistics,
  addStudyMaterial,
  getStudyMaterialsBySubject,
  getStudyMaterialsByBranch,
  updateStudyMaterial,
  deleteStudyMaterial,
};
