/**
 * @file axios.js
 * @description Configured Axios instance for all API requests.
 *
 * Sets the base URL to the backend API and automatically attaches the JWT
 * from sessionStorage to every outgoing request via a request interceptor.
 *
 * sessionStorage is used (rather than localStorage) so the token is cleared
 * automatically when the browser tab or window is closed, effectively logging
 * the user out on app close.
 */

import axios from 'axios';

// In development the React proxy (package.json "proxy") forwards /api requests
// to localhost:5000. In production, set REACT_APP_API_URL to the deployed backend URL.
export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Axios instance with the backend API base URL pre-configured.
 * All API calls in the app use this instance so the base URL is defined once.
 */
const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

/**
 * Request interceptor — JWT injection.
 *
 * Before every request is sent, reads the stored user object from
 * sessionStorage and, if a token is present, adds it to the Authorization
 * header in the Bearer scheme expected by the backend `protect` middleware.
 */
API.interceptors.request.use((config) => {
  const user = JSON.parse(sessionStorage.getItem('recipenest_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

/**
 * Helper: getImageUrl
 *
 * Converts a relative image path stored in the database (e.g. "/uploads/foo.jpg")
 * into a full URL that the browser can load. Absolute URLs (already starting
 * with "http") are returned unchanged.
 *
 * @param {string|null} path - The image path from the API response.
 * @returns {string|null} Full URL, or null if no path was provided.
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already a full URL
  return `${BASE_URL}${path}`;
};

export default API;
