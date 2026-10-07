import axios from 'axios';

// Use CRA dev-server proxy (/api → http://localhost:8083/api)
// This avoids CORS preflight on every mutation and is the recommended approach for local dev.
// The proxy is configured in package.json: "proxy": "http://localhost:8083"
const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor for clear error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  }
);

// Consumers API
export const consumerService = {
  getAll: () => apiClient.get('/consumers').then((res) => res.data),
  getById: (id) => apiClient.get(`/consumers/${id}`).then((res) => res.data),
  getAboveAverage: () => apiClient.get('/consumers/above-average').then((res) => res.data),
  create: (data) => apiClient.post('/consumers', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/consumers/${id}`, data).then((res) => res.data),
  // Cascade delete: removes bills → readings → connections → consumer atomically
  delete: (id) => apiClient.delete(`/consumers/${id}/cascade`).then((res) => res.data?.message || 'Deleted'),
};

// Connections API
export const connectionService = {
  getAll: () => apiClient.get('/connections').then((res) => res.data),
  getById: (id) => apiClient.get(`/connections/${id}`).then((res) => res.data),
  getByConsumer: (consumerId) => apiClient.get(`/connections/consumer/${consumerId}`).then((res) => res.data),
  create: (data) => apiClient.post('/connections', data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/connections/${id}`).then((res) => res.data?.message || 'Deleted'),
};

// Readings API
export const readingService = {
  getAll: () => apiClient.get('/readings').then((res) => res.data),
  getById: (id) => apiClient.get(`/readings/${id}`).then((res) => res.data),
  getByConnection: (connectionId) => apiClient.get(`/readings/connection/${connectionId}`).then((res) => res.data),
  getUsageTrend: (connectionId) => apiClient.get(`/readings/connection/${connectionId}/usage-trend`).then((res) => res.data),
  getBillPrediction: (connectionId) => apiClient.get(`/readings/connection/${connectionId}/bill-prediction`).then((res) => res.data),
  getUsageInsight: (connectionId) => apiClient.get(`/readings/connection/${connectionId}/usage-insight`).then((res) => res.data),
  create: (data) => apiClient.post('/readings', data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/readings/${id}`).then((res) => res.data?.message || 'Deleted'),
};

// Bills API
export const billService = {
  getAll: () => apiClient.get('/bills').then((res) => res.data),
  getById: (id) => apiClient.get(`/bills/${id}`).then((res) => res.data),
  getWithConsumer: () => apiClient.get('/bills/with-consumer').then((res) => res.data),
  getCompleteDetails: () => apiClient.get('/bills/complete-details').then((res) => res.data),
  getByStatus: (status) => apiClient.get(`/bills/status/${status}`).then((res) => res.data),
  getByConsumer: (consumerId) => apiClient.get(`/bills/consumer/${consumerId}`).then((res) => res.data),
  create: (data) => apiClient.post('/bills', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/bills/${id}`, data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/bills/${id}`).then((res) => res.data?.message || 'Deleted'),
};

// Water Billing Stored Functions & Procedures
export const waterBillingService = {
  // MySQL Function calculate_water_charge(units)
  calculateCharge: (units) => apiClient.get(`/water-billing/calculate-charge/${units}`).then((res) => res.data),
  // MySQL Stored Procedure generate_water_bill(readingId) - returns {message: '...'}
  generateBill: (readingId) => apiClient.post(`/water-billing/generate-bill/${readingId}`).then((res) => res.data?.message || 'Bill generated'),
};

export default apiClient;
