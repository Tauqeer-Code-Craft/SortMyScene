import axios from 'axios';

// Set backend URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to inject JWT token into requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth endpoints
export const login = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await API.post('/auth/register', { name, email, password });
  return response.data;
};

// Events endpoints
export const getEvents = async () => {
  const response = await API.get('/events');
  return response.data;
};

export const getEventById = async (id) => {
  const response = await API.get(`/events/${id}`);
  return response.data;
};

export const getEventSeats = async (id) => {
  const response = await API.get(`/events/${id}/seats`);
  return response.data;
};

// Reservation & Booking endpoints
export const reserveSeats = async (eventId, seatNumbers) => {
  const response = await API.post('/reserve', { eventId, seatNumbers });
  return response.data;
};

export const confirmBooking = async (reservationId) => {
  const response = await API.post('/bookings', { reservationId });
  return response.data;
};

export const getMyBookings = async () => {
  const response = await API.get('/bookings/my');
  return response.data;
};
