import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export interface UserProfile {
  state?: string;
  district?: string;
  landHolding?: number;
  cropType?: string;
  socialCategory?: string;
  gender?: string;
  age?: number;
  occupation?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'user' | 'admin';
  profile?: UserProfile;
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
  eligibility?: {
    isEligible: boolean;
    reason: string;
    citation: string;
    benefitAmount: string;
  };
}

export const login = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const register = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

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

export const getRecommendedSchemes = async (userProfile: UserProfile) => {
  const response = await api.post('/schemes/recommend', { userProfile });
  return response.data;
};

export const checkSchemeEligibility = async (schemeId: string, userProfile: UserProfile) => {
  const response = await api.post('/schemes/eligibility', { schemeId, userProfile });
  return response.data;
};

export const parseVoiceProfile = async (spokenText: string) => {
  const response = await api.post('/schemes/extract-profile', { spokenText });
  return response.data;
};

export const getDashboardMetrics = async () => {
  const response = await api.get('/schemes/metrics');
  return response.data;
};

export default api;