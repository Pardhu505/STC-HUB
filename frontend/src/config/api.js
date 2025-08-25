import axios from 'axios';

// API configuration that automatically detects the correct backend URL
const getBackendConfig = () => {
  // For development/testing environment
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('preview.emergentagent.com')) {
    return {
      apiUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api',
      wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8001/api/ws/'
    };
  }
  
  // For production environment
  return {
    apiUrl: process.env.REACT_APP_BACKEND_URL,
    wsUrl: process.env.REACT_APP_WS_URL
  };
};

export const API_CONFIG = getBackendConfig();
export const { apiUrl: BACKEND_URL, wsUrl: WS_URL } = API_CONFIG;

const api = axios.create({
  baseURL: BACKEND_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const uploadAttendance = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/attendance/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAttendance = async (userId, startDate, endDate) => {
  const params = {
    user_id: userId,
  };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get('/attendance', { params });
  return response.data;
};