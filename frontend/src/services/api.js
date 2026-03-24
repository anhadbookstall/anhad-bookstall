// src/services/api.js
// Central API configuration using Axios
// All API calls go through this file
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (token expired) by redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const adminLogin = (data) => api.post('/auth/admin/login', data);
export const volunteerGoogleLogin = (credential) => api.post('/auth/volunteer/google', { credential });
export const getMe = () => api.get('/auth/me');

// ---- Books ----
export const getBooks = (params) => api.get('/books', { params });
export const getLowStockBooks = () => api.get('/books/low-stock');
export const addBook = (data) => api.post('/books', data);
export const updateBook = (id, data) => api.put(`/books/${id}`, data);
export const deleteBook = (id) => api.delete(`/books/${id}`);

// ---- Volunteers ----
export const getVolunteers = (params) => api.get('/volunteers', { params });
export const getVolunteer = (id) => api.get(`/volunteers/${id}`);
export const addVolunteer = (data) => api.post('/volunteers', data);
export const updateVolunteer = (id, data) => api.put(`/volunteers/${id}`, data);
export const uploadVolunteerPhoto = (id, formData) =>
  api.put(`/volunteers/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const suspendVolunteer = (id) => api.put(`/volunteers/${id}/suspend`);
export const revokeSupension = (id) => api.put(`/volunteers/${id}/revoke`);
export const removeVolunteer = (id) => api.delete(`/volunteers/${id}`);
export const toggleBookstallLead = (id) => api.put(`/volunteers/${id}/toggle-lead`);

// ---- Cities ----
export const getCities = () => api.get('/cities');
export const addCity = (data) => api.post('/cities', data);
export const deleteCity = (id) => api.delete(`/cities/${id}`);

// ---- Inventory ----
export const getInventoryHistory = () => api.get('/inventory');
export const updateInventory = (formData) =>
  api.post('/inventory', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ---- Bookstalls ----
export const getBookstalls = (params) => api.get('/bookstalls', { params });
export const getActiveBookstall = () => api.get('/bookstalls/active');
export const getBookstall = (id) => api.get(`/bookstalls/${id}`);
export const startBookstall = (data) => api.post('/bookstalls/start', data);
export const closeBookstall = (id) => api.put(`/bookstalls/${id}/close`);
export const exitBookstall = (id) => api.put(`/bookstalls/${id}/exit`);
export const rejoinBookstall = (id) => api.put(`/bookstalls/${id}/rejoin`);
export const addReflection = (id, text) => api.post(`/bookstalls/${id}/reflection`, { text });

// ---- Sales ----
export const getSales = (params) => api.get('/sales', { params });
export const addSale = (formData) =>
  api.post('/sales', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ---- Expenditures ----
export const getExpenditures = (params) => api.get('/expenditures', { params });
export const addExpenditure = (data) => api.post('/expenditures', data);

// ---- Schedules ----

// ---- Dashboard ----
export const getDashboardSummary = (params) => api.get('/dashboard/summary', { params });
export const getBookSalesChart = (params) => api.get('/dashboard/books-sales', { params });
export const getGenderAgeChart = () => api.get('/dashboard/gender-age');
export const getVolunteerEfficiency = (params) => api.get('/dashboard/volunteer-efficiency', { params });
export const getSalesTrend = (params) => api.get('/dashboard/sales-trend', { params });

// ---- Notifications ----
export const getNotifications = () => api.get('/notifications');
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');

export default api;

export const getAllReflections = () => api.get('/bookstalls/reflections/all');
export const getBookstallSummary = (id) => api.get(`/bookstalls/${id}/summary`);

// Reflection Posts (social feed)
export const getReflectionPosts = () => api.get('/reflection-posts');
export const createReflectionPost = (formData) =>
  api.post('/reflection-posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const reactToPost = (id, emoji) => api.post(`/reflection-posts/${id}/react`, { emoji });
export const addComment = (id, text) => api.post(`/reflection-posts/${id}/comments`, { text });
export const deleteComment = (id, commentId) => api.delete(`/reflection-posts/${id}/comments/${commentId}`);
export const deleteReflectionPost = (id) => api.delete(`/reflection-posts/${id}`);

export const parseInvoice = (formData) =>
  api.post('/inventory/parse-invoice', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const confirmInvoice = (data) => api.post('/inventory/confirm-invoice', data);

export const getCurrentTheme = () => api.get('/themes/current');
export const getAllThemes = () => api.get('/themes');
export const setMonthlyTheme = (data) => api.post('/themes', data);
export const deleteTheme = (id) => api.delete(`/themes/${id}`);

export const getBookInventoryHistory = (bookId) => api.get(`/inventory/book/${bookId}`);