const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (includeAuth && token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers(!options.skipAuth), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// Auth
export const auth = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

// Tickets
export const tickets = {
  list: (params) => api('/tickets' + (params ? '?' + new URLSearchParams(params) : '')),
  get: (id) => api(`/tickets/${id}`),
  create: (body) => api('/tickets', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  addMessage: (id, content) => api(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  categories: () => api('/tickets/categories'),
  statuses: () => api('/tickets/statuses'),
};

// Appointments
export const appointments = {
  list: () => api('/appointments'),
  slots: (start, end) => api(`/appointments/slots?start_date=${start}&end_date=${end || start}`),
  create: (body) => api('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  cancel: (id) => api(`/appointments/${id}`, { method: 'DELETE' }),
};

// Lab results
export const labResults = {
  list: (patientId) => api('/lab-results' + (patientId ? `?patient_id=${patientId}` : '')),
  get: (id) => api(`/lab-results/${id}`),
  create: (body) => api('/lab-results', { method: 'POST', body: JSON.stringify(body) }),
};

// AI Scheduling
export const aiScheduling = {
  recommend: (request) => api('/ai-scheduling/recommend', { method: 'POST', body: JSON.stringify({ request }) }),
};

// Analytics
export const analytics = {
  dashboard: () => api('/analytics/dashboard'),
  async exportTickets() {
    const res = await fetch(`${API_BASE}/analytics/export/tickets`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tickets.csv';
    a.click();
  },
  async exportAppointments() {
    const res = await fetch(`${API_BASE}/analytics/export/appointments`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'appointments.csv';
    a.click();
  },
};

// Users (staff only)
export const users = {
  list: (role) => api('/users' + (role ? `?role=${role}` : '')),
};

// Availability (staff)
export const availability = {
  list: () => api('/availability'),
  create: (body) => api('/availability', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id) => api(`/availability/${id}`, { method: 'DELETE' }),
};
