const API_BASE = '/api';

function authHeaders(json = true) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  return res.json();
}

async function handleResponseOrThrow(res) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// Auth
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  // Normalize response: backend returns accessToken (camelCase)
  if (data.accessToken) {
    data.access_token = data.accessToken;
  }
  return data;
}

export async function getProfile() {
  const res = await fetch(`${API_BASE}/authentication/me`, {
    headers: authHeaders(false)
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export async function getMyPermissions() {
  const res = await fetch(`${API_BASE}/authentication/permissions`, {
    headers: authHeaders(false)
  });
  const data = await handleResponseOrThrow(res);
  return data.permissions || [];
}

// Buildings
export async function getBuildings() {
  const res = await fetch(`${API_BASE}/buildings`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function getBuilding(id) {
  const res = await fetch(`${API_BASE}/buildings/${id}`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function createBuilding(data) {
  const res = await fetch(`${API_BASE}/buildings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateBuilding(id, data) {
  const res = await fetch(`${API_BASE}/buildings/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteBuilding(id) {
  const res = await fetch(`${API_BASE}/buildings/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false)
  });
  return handleResponse(res);
}

// Properties
export async function getProperties(buildingId) {
  const res = await fetch(`${API_BASE}/buildings/${buildingId}/properties`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function createProperty(data) {
  const res = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateProperty(id, data) {
  const res = await fetch(`${API_BASE}/properties/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteProperty(id) {
  const res = await fetch(`${API_BASE}/properties/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false)
  });
  return handleResponse(res);
}

// Payments
export async function getPayments(propertyId) {
  const res = await fetch(`${API_BASE}/properties/${propertyId}/payments`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function getPaymentsByYear(propertyId, year) {
  const res = await fetch(`${API_BASE}/properties/${propertyId}/payments/${year}`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function createPayment(data) {
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updatePayment(id, data) {
  const res = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deletePayment(id) {
  const res = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false)
  });
  return handleResponse(res);
}

// Expenses
export async function getExpenses(buildingId, year) {
  const res = await fetch(`${API_BASE}/expenses/building/${buildingId}/year/${year}`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function createExpense(data) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false)
  });
  return handleResponse(res);
}

// Reports
export async function getYearlyReport(buildingId, year, fromMonth = 1, toMonth = 12) {
  const res = await fetch(`${API_BASE}/reports/building/${buildingId}/year/${year}?fromMonth=${fromMonth}&toMonth=${toMonth}`, { headers: authHeaders(false) });
  return handleResponse(res);
}

// Users (rental people/tenants)
export async function getUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/users${query ? '?' + query : ''}`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function getUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function createUser(data) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateUser(id, data) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false)
  });
  return handleResponse(res);
}

export async function refreshUserData(id) {
  const res = await fetch(`${API_BASE}/users/${id}/refresh`, {
    method: 'POST',
    headers: authHeaders(false)
  });
  return handleResponse(res);
}

export async function getUserReport(userId, year) {
  const res = await fetch(`${API_BASE}/users/${userId}/report/${year}`, { headers: authHeaders(false) });
  return handleResponse(res);
}

// Admin Users (auth accounts)
export async function getAdminUsers() {
  const res = await fetch(`${API_BASE}/admin-users?$getAll=true&$populate=groups,allowedBuildingIds`, { headers: authHeaders(false) });
  const result = await handleResponseOrThrow(res);
  const all = result.data || result;
  // Filter to only auth accounts (have username and email)
  return Array.isArray(all) ? all.filter(u => u.username && u.email) : all;
}

export async function getAdminUser(id) {
  const res = await fetch(`${API_BASE}/admin-users/${id}`, { headers: authHeaders(false) });
  return handleResponse(res);
}

export async function createAdminUser(data) {
  const res = await fetch(`${API_BASE}/admin-users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponseOrThrow(res);
}

export async function updateAdminUser(id, data) {
  const res = await fetch(`${API_BASE}/admin-users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponseOrThrow(res);
}

export async function deleteAdminUser(id) {
  const res = await fetch(`${API_BASE}/admin-users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false)
  });
  return handleResponseOrThrow(res);
}

export async function changePassword(data) {
  const res = await fetch(`${API_BASE}/admin-users/change-password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponseOrThrow(res);
}

export async function updateMyProfile(data) {
  const res = await fetch(`${API_BASE}/admin-users/me/profile`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponseOrThrow(res);
}

// Groups (for role selection)
export async function getGroups() {
  const res = await fetch(`${API_BASE}/groups?$pageSize=100`, { headers: authHeaders(false) });
  const result = await handleResponseOrThrow(res);
  return result.data || result;
}

// Building AI
export async function askBuildingAi(buildingId, question, history = []) {
  const res = await fetch(`${API_BASE}/buildings/${buildingId}/ask-ai`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ question, history })
  });
  return handleResponseOrThrow(res);
}

export async function getAiDashboardOverview() {
  const res = await fetch(`${API_BASE}/ai-dashboard/overview`, { headers: authHeaders(false) });
  return handleResponseOrThrow(res);
}

export async function getAiPrompts() {
  const res = await fetch(`${API_BASE}/ai-dashboard/prompts`, { headers: authHeaders(false) });
  return handleResponseOrThrow(res);
}

export async function createAiPrompt(data) {
  const res = await fetch(`${API_BASE}/ai-dashboard/prompts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponseOrThrow(res);
}

export async function updateAiPrompt(id, data) {
  const res = await fetch(`${API_BASE}/ai-dashboard/prompts/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponseOrThrow(res);
}

export async function activateAiPrompt(id) {
  const res = await fetch(`${API_BASE}/ai-dashboard/prompts/${id}/activate`, {
    method: 'POST',
    headers: authHeaders(false)
  });
  return handleResponseOrThrow(res);
}
