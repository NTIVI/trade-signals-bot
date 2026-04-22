import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout to prevent infinite hanging
});

// Logging interceptors for debugging slow requests
api.interceptors.request.use(config => {
  config.metadata = { startTime: new Date() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`[API] ${response.config.method.toUpperCase()} ${response.config.url} took ${duration}ms`);
    return response;
  },
  (error) => {
    if (error.config) {
      const duration = new Date() - error.config.metadata.startTime;
      console.error(`[API] ${error.config.method.toUpperCase()} ${error.config.url} failed after ${duration}ms:`, error.message);
    }
    return Promise.reject(error);
  }
);

export const socket = io(SOCKET_URL);

// --- User Profiles ---

export const getProfile = async (id) => {
  try {
    const response = await api.get(`/profiles/${id}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) return null;
    throw error;
  }
};

export const saveProfile = async (profileData) => {
  const response = await api.post('/profiles', profileData);
  return response.data;
};

// --- Matches & Swiping ---

export const getPotentialMatches = async (userId, gender) => {
  const response = await api.get(`/users?userId=${userId}&gender=${gender}`);
  return response.data;
};

export const likeUser = async (fromUser, toUser) => {
  const response = await api.post('/likes', { from_user: fromUser, to_user: toUser });
  return response.data; // { isMatch: boolean, match?: object }
};

export const getMyMatches = async (userId) => {
  const response = await api.get(`/matches/${userId}`);
  return response.data;
};

export const getMatchDetail = async (matchId) => {
  const response = await api.get(`/matches/detail/${matchId}`);
  return response.data;
};

// --- Chat ---

export const getMessages = async (matchId) => {
  const response = await api.get(`/messages/${matchId}`);
  return response.data;
};

export const getStats = async (userId) => {
  const response = await api.get(`/stats/${userId}`);
  return response.data;
};
