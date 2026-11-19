import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:8000' })

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const auth = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
}

export const users = {
  list: () => API.get('/admin/users'),
  update: (id, data) => API.put(`/admin/users/${id}`, data),
  remove: (id) => API.delete(`/admin/users/${id}`),
}

export const customers = {
  list: () => API.get('/customers'),
  create: (data) => API.post('/customers', data),
  get: (id) => API.get(`/customers/${id}`),
}

export const predictions = {
  create: (data) => API.post('/predict', data),
  list: () => API.get('/predictions'),
}

export const subscriptions = {
  create: (data) => API.post('/subscriptions', data),
  list: () => API.get('/subscriptions'),
}

export const admin = {
  stats: () => API.get('/admin/stats'),
  retrain: () => API.post('/admin/retrain'),
}

export const model = {
  info: () => API.get('/model'),
  retrainStatus: () => API.get('/retrain/status'),
}