// src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  
  // Profile endpoints
  PROFILE: (username) => `${API_BASE_URL}/api/v1/profile/${username}`,
  UPDATE_PROFILE: (username) => `${API_BASE_URL}/api/v1/profile/${username}`,
  CHANGE_PASSWORD: (username) => `${API_BASE_URL}/api/v1/profile/${username}/password`,
  DELETE_ACCOUNT: (username) => `${API_BASE_URL}/api/v1/profile/${username}`,
  
  // Room endpoints
  ROOMS: `${API_BASE_URL}/api/v1/rooms`,
  CREATE_ROOM: `${API_BASE_URL}/api/v1/rooms/create`,
  JOIN_ROOM: `${API_BASE_URL}/api/v1/rooms/join`,
  GET_ROOM: (roomId) => `${API_BASE_URL}/api/v1/rooms/${roomId}`,
  USER_ROOMS: (username) => `${API_BASE_URL}/api/v1/rooms/user/${username}`,
  ROOM_MESSAGES: (roomId) => `${API_BASE_URL}/api/v1/rooms/${roomId}/messages`,
  UPLOAD_PHOTO: (roomId) => `${API_BASE_URL}/api/v1/rooms/${roomId}/photos`,
  
  // WebSocket - Convert http/https to ws/wss
  WS_URL: API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/chat',
};

export default API_BASE_URL;