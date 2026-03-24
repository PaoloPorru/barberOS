import api from './client';

// ─── AUTH ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  refresh:  (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout:   () => api.post('/auth/logout'),
  me:       () => api.get('/auth/me'),
};

// ─── APPOINTMENTS ─────────────────────────────────────────────
export const appointmentsAPI = {
  getAll:   (params) => api.get('/appointments', { params }),
  getOne:   (id) => api.get(`/appointments/${id}`),
  create:   (data) => api.post('/appointments', data),
  update:   (id, data) => api.patch(`/appointments/${id}`, data),
  cancel:   (id) => api.delete(`/appointments/${id}`),
  setStatus:(id, status) => api.patch(`/appointments/${id}/status`, { status }),
};

// ─── SLOTS ────────────────────────────────────────────────────
export const slotsAPI = {
  getAvailable: (barber_id, date, service_id) =>
    api.get('/slots', { params: { barber_id, date, service_id } }),
};

// ─── BARBERS ─────────────────────────────────────────────────
export const barbersAPI = {
  getAll:           () => api.get('/barbers'),
  getOne:           (id) => api.get(`/barbers/${id}`),
  getAvailability:  (id) => api.get(`/barbers/${id}/availability`),
  setAvailability:  (id, data) => api.put(`/barbers/${id}/availability`, data),
  getBlockedSlots:  (id) => api.get(`/barbers/${id}/blocked-slots`),
  blockSlot:        (id, data) => api.post(`/barbers/${id}/blocked-slots`, data),
  unblockSlot:      (id, slotId) => api.delete(`/barbers/${id}/blocked-slots/${slotId}`),
};

// ─── SERVICES ────────────────────────────────────────────────
export const servicesAPI = {
  getAll:  () => api.get('/services'),
  getOne:  (id) => api.get(`/services/${id}`),
};

// ─── PROFILE ─────────────────────────────────────────────────
export const profileAPI = {
  get:            () => api.get('/profile'),
  update:         (data) => api.patch('/profile', data),
  changePassword: (data) => api.patch('/profile/password', data),
};

// ─── ADMIN ───────────────────────────────────────────────────
export const adminAPI = {
  getStats:       (period) => api.get('/admin/stats', { params: { period } }),
  getUsers:       (params) => api.get('/admin/users', { params }),
  deactivateUser: (id) => api.delete(`/admin/users/${id}`),
  getAppointments:(params) => api.get('/admin/appointments', { params }),
  createBarber:   (data) => api.post('/admin/barbers', data),
  updateBarber:   (id, data) => api.put(`/admin/barbers/${id}`, data),
  createService:  (data) => api.post('/admin/services', data),
  updateService:  (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService:  (id) => api.delete(`/admin/services/${id}`),
};
