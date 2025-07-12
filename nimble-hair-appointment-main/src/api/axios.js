import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  // baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Ensures cookies/sessions are sent
});

export default api;
