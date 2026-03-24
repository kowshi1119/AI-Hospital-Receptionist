/**
 * API Service for backend communication
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token and handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData - let Axios set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || '');
    const isAuthEndpoint = requestUrl.includes('/auth/login/')
      || requestUrl.includes('/auth/register/')
      || requestUrl.includes('/auth/register_by_admin/');

    if (status === 401 && !isAuthEndpoint) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  registerByAdmin: (data) => api.post('/auth/register_by_admin/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => {
    // Support both JSON and FormData payloads (for profile picture upload)
    if (data instanceof FormData) {
      return api.patch('/users/update_profile/', data);
    }

    const formData = new FormData();
    Object.keys(data || {}).forEach((key) => {
      const value = data[key];
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    return api.patch('/users/update_profile/', formData);
  },
  getPendingUsers: () => api.get('/users/pending/'),
  approveUser: (userId, action) => api.post(`/users/${userId}/approve/`, { action }),
  getAllUsers: () => api.get('/users/'),
  getById: (id) => api.get(`/users/${id}/`),
  updateUser: (id, data) => api.patch(`/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/users/${id}/`),
};

// Doctor APIs
export const doctorAPI = {
  getAll: (params) => api.get('/doctors/', { params }),
  getById: (id) => api.get(`/doctors/${id}/`),
  create: (data) => api.post('/doctors/', data),
  update: (id, data) => api.patch(`/doctors/${id}/`, data),
  delete: (id) => api.delete(`/doctors/${id}/`),
};

// Availability APIs
export const availabilityAPI = {
  getAll: (params) => api.get('/availability/', { params }),
  create: (data) => api.post('/availability/', data),
  update: (id, data) => api.patch(`/availability/${id}/`, data),
  delete: (id) => api.delete(`/availability/${id}/`),
};

// Patient APIs
export const patientAPI = {
  getAll: (params) => api.get('/patients/', { params }),
  getById: (id) => api.get(`/patients/${id}/`),
  create: (data) => api.post('/patients/', data),
  update: (id, data) => api.patch(`/patients/${id}/`, data),
  delete: (id) => api.delete(`/patients/${id}/`),
};

// Appointment APIs
export const appointmentAPI = {
  getAll: (params) => api.get('/appointments/', { params }),
  getById: (id) => api.get(`/appointments/${id}/`),
  create: (formData) => {
    const rawTime = formData.appointment_time || formData.time;
    const formattedTime = typeof rawTime === 'string' && rawTime.includes(':')
      ? (rawTime.split(':').length === 2 ? `${rawTime}:00` : rawTime)
      : rawTime;

    const payload = {
      patient_name: formData.patient_name || formData.patientName,
      patient_age: parseInt(formData.patient_age || formData.patientAge, 10),
      patient_disease: formData.patient_disease || formData.patientDisease,
      contact_number: formData.contact_number || formData.contactNumber,
      address: formData.address ?? '',
      doctor: formData.doctor || formData.doctorId,
      appointment_date: formData.appointment_date || formData.date,
      appointment_time: formattedTime,
    };

    return api.post('/appointments/', payload);
  },
  update: (id, data) => api.patch(`/appointments/${id}/`, data),
  delete: (id) => api.delete(`/appointments/${id}/`),
  accept: (id) => api.post(`/appointments/${id}/accept/`),
  reject: (id) => api.post(`/appointments/${id}/reject/`),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/'),
};

// Call Logs APIs
export const callLogsAPI = {
  getAll: (params) => api.get('/call-logs/', { params }),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get('/notifications/', { params }),
};

// Hospital News APIs
export const hospitalNewsAPI = {
  sendToAll: (data) => api.post('/hospital-news/', data),
  list: () => api.get('/hospital-news/list/'),
  create: (data) => {
    // Support optional image upload via FormData
    if (data instanceof FormData) {
      return api.post('/hospital-news/create/', data);
    }
    const formData = new FormData();
    Object.keys(data || {}).forEach((key) => {
      const value = data[key];
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    return api.post('/hospital-news/create/', formData);
  },
  delete: (id) => api.delete(`/hospital-news/${id}/delete/`),
};

// Site Settings (logo, banner)
export const siteSettingsAPI = {
  get: () => api.get('/site-settings/'),
  getPublic: () => api.get('/site-settings/public/'), // No auth - for login/landing pages
  update: (data) => {
    if (data instanceof FormData) {
      return api.patch('/site-settings/update/', data);
    }
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] != null && data[key] !== '')
        formData.append(key, data[key] instanceof File ? data[key] : data[key]);
    });
    return api.patch('/site-settings/update/', formData);
  },
};

// Chat APIs
export const chatAPI = {
  searchUsers: (query) =>
    api.get('/chat-users/', { params: { q: query || '' } }),
  getMessages: (otherUserId) =>
    api.get('/chat-messages/', { params: { with_user: otherUserId } }),
  sendMessage: (receiverId, message) =>
    api.post('/chat-messages/', { receiver_id: receiverId, message }),
  deleteMessage: (id) => api.delete(`/chat-messages/${id}/`),
};

// Send message to specific user (email)
export const messageAPI = {
  sendToUser: (data) => api.post('/send-message/', data),
};

// Ambulance APIs
export const ambulanceAPI = {
  create: (data) => api.post('/ambulance/', data),
  getAll: (params) => api.get('/ambulance/', { params }),
  updateStatus: (id, status) => api.patch(`/ambulance/${id}/`, { status }),
};

// Call AI APIs
export const callAIAPI = {
  getRequests: (params) => api.get('/call-ai/requests/', { params }),
  simulateCall: (caller) => api.post('/twilio/simulate/', { caller }),
  transferCall: (callSid) => api.post(`/calls/${callSid}/transfer/`),
};

export default api;
