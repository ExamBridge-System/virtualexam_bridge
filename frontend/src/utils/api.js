import axios from 'axios';

// API base URL
const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://virtualexam-bridge.onrender.com/api'
    : 'http://localhost:3001/api';

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

// Student API functions for email change
export const studentAPI = {
  sendVerificationCode: (newEmail) => api.post('/student/send-verification-code', { newEmail }),
  verifyEmail: (newEmail, code) => api.post('/student/verify-email', { newEmail, code }),
};

export default api;
