import axios from 'axios';

// In dev the React proxy handles /api → localhost:5000
// In production set REACT_APP_API_URL to your deployed backend
export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Base API instance
const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('recipenest_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Helper: turn a relative /uploads/... path into a full URL
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

export default API;
