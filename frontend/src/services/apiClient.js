import axios from 'axios';

const runtimeApiUrl =
  (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_API_URL) || '';

const baseURL = runtimeApiUrl || import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

export default apiClient;
