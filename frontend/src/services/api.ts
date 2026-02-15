import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UserProfile {
  state?: string;
  gender?: string;
  caste?: string;
}

export interface Scheme {
  _id: string;
  name: string;
  benefits: {
    type: string;
    max_value_inr: number;
    description: string;
  };
  filters: {
    state: string[];
    gender: string[];
    caste: string[];
  };
  score?: number;
  snippet?: string;
}

export const searchSchemes = async (query: string, userProfile?: UserProfile) => {
  const response = await api.post('/schemes/search', { query, userProfile });
  return response.data;
};

export const chatWithScheme = async (query: string, userProfile?: UserProfile) => {
  const response = await api.post('/schemes/chat', { query, userProfile });
  return response.data;
};

export const ingestScheme = async (formData: FormData) => {
  const response = await api.post('/schemes/ingest', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAllSchemes = async () => {
    const response = await api.get('/schemes/debug');
    return response.data;
}

export default api;