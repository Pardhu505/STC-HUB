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