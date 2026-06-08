const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Events
  getEvents: () => req('/api/events'),
  getEvent: (id) => req(`/api/events/${id}`),
  createEvent: (data) => req('/api/events', { method: 'POST', body: JSON.stringify(data) }),
  deleteEvent: (id) => req(`/api/events/${id}`, { method: 'DELETE' }),

  // Laborers
  getLaborers: () => req('/api/laborers'),
  createLaborer: (data) => req('/api/laborers', { method: 'POST', body: JSON.stringify(data) }),
  updateLaborer: (id, data) => req(`/api/laborers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLaborer: (id) => req(`/api/laborers/${id}`, { method: 'DELETE' }),
};
