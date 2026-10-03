// All calls to the Next.js API route live here.
const BASE_URL = `/api/customers`;

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw { message: 'Cannot reach the server. Make sure your Next.js app is running.' };
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { status: res.status, message: body.message || `Request failed (${res.status})`, errors: body.errors || {} };
  }
  return body;
}

export function listCustomers({ search = '', status = '', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  return request(`${BASE_URL}?${params}`);
}

export function getCustomer(id) {
  return request(`${BASE_URL}/${id}`);
}

export function createCustomer(data) {
  return request(BASE_URL, { method: 'POST', body: JSON.stringify(data) });
}

export function updateCustomer(id, data) {
  return request(`${BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCustomer(id) {
  return request(`${BASE_URL}/${id}`, { method: 'DELETE' });
}
