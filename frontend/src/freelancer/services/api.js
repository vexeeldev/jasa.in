import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Pasang Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Logout jika Token Expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Gunakan replace agar user tidak bisa klik "back" ke halaman terproteksi
      window.location.replace('/login'); 
    }
    return Promise.reject(error);
  }
);

// --- AUTH APIs ---
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  // Pastikan di controller backend ada endpoint ini nanti
  changePassword: (passwords) => api.put('/auth/change-password', passwords)
};

export default api;