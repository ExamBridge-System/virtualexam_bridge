import axios from 'axios';

// 1. CRITICAL FIX: Change port 3001 to 5000
const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { // Added this header, it's good practice
    'Content-Type': 'application/json',
  },
});

// 2. Your interceptor is perfect. No changes needed.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // This matches your 'auth.js' middleware
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;