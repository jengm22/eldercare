import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

export default api;

export const medicationService = {
  getAll: (patientId) => api.get(`/patients/${patientId}/medications`),
  logTaken: (id, data) => api.post(`/medications/${id}/log`, data),
};

// export const appointmentService = {
//   getAll: (patientId) => api.get(`/patients/${patientId}/appointments`),
// };

export const appointmentService = {
    getAll: (patientId) => api.get(`/appointments/${patientId}`),
    create: (data) => api.post('/appointments', data),
    update: (id, data) => api.put(`/appointments/${id}`, data),
    cancel: (id) => api.patch(`/appointments/${id}/cancel`),
    delete: (id) => api.delete(`/appointments/${id}`)
  };

export const vitalService = {
  getAll: (patientId) => api.get(`/patients/${patientId}/vitals`),
};

export const emergencyContactService = {
  getAll: (patientId) => api.get(`/patients/${patientId}/emergency-contacts`),
};

export const checkinService = {
  getAll: (patientId) => api.get(`/patients/${patientId}/checkins`),
};

export const messageService = {
  getAll: (patientId) => api.get(`/patients/${patientId}/messages`),
};

export const documentService = {
  getAll: (patientId) => api.get(`/patients/${patientId}/documents`),
};

export const activityService = {
  getAll: (patientId) => api.get(`/patients/${patientId}/activities`),
  update: (id, data) => api.put(`/activities/${id}`, data),
};

export const reminderService = {
  getAll: (patientId) => api.get(`/patients/${patientId}/reminders`),
  update: (id, data) => api.put(`/reminders/${id}`, data),
};

export const billingService = {
  getInvoices: (patientId) => api.get(`/patients/${patientId}/invoices`),
};