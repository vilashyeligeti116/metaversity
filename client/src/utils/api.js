const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function getToken() { return localStorage.getItem('mv_token'); }

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  delete: (path)       => request('DELETE', path),
};

export const authApi = {
  register:      (data)  => api.post('/api/auth/register', data),
  login:         (data)  => api.post('/api/auth/login',    data),
  me:            ()      => api.get('/api/auth/me'),
  profile:       (data)  => api.put('/api/auth/profile',   data),
  validateInvite:(token) => api.get(`/api/auth/invite/${token}`),
};

export const ideaApi = {
  submit:       (data)              => api.post('/api/ideas',                   data),
  myIdeas:      ()                  => api.get('/api/ideas/my'),
  get:          (id)                => api.get(`/api/ideas/${id}`),
  all:          (params = '')       => api.get(`/api/ideas${params}`),
  stats:        ()                  => api.get('/api/ideas/admin/stats'),
  assignExpert: (id, expertId)      => api.put(`/api/ideas/${id}/assign-expert`, { expertId }),
  decide:       (id, decision, note)=> api.put(`/api/ideas/${id}/decide`,        { decision, adminNote: note }),
  assignOffice: (id, data)          => api.put(`/api/ideas/${id}/assign-office`, data),
  submitReview: (id, data)          => api.put(`/api/ideas/${id}/review`,         data),
  expertQueue:  ()                  => api.get('/api/ideas/expert/queue'),
};

export const userApi = {
  experts:       ()    => api.get('/api/users/experts'),
  all:           (r)   => api.get(`/api/users${r ? `?role=${r}` : ''}`),
  createExpert:  (d)   => api.post('/api/users/expert', d),
  toggle:        (id)  => api.put(`/api/users/${id}/toggle`),
  offices:       ()    => api.get('/api/users/offices'),
  notifications: ()    => api.get('/api/users/notifications'),
  readAll:       ()    => api.put('/api/users/notifications/read-all'),
  // Invite system
  generateInvite:(maxUses) => api.post('/api/users/invite/generate', { maxUses }),
  myInvites:     ()        => api.get('/api/users/invite/my'),
  revokeInvite:  (token)   => api.delete(`/api/users/invite/${token}`),
  // Team management
  myTeam:        ()        => api.get('/api/users/team'),
  removeEmployee:(id)      => api.delete(`/api/users/team/${id}`),
  // Office info (employee + founder)
  myOffice:      ()        => api.get('/api/users/my-office'),
  // Announcements
  postAnnouncement:(data)  => api.post('/api/users/announcements', data),
  announcements: ()        => api.get('/api/users/announcements'),
};
