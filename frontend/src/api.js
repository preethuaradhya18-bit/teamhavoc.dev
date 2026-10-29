// NetZero Prints API Client
export const API_BASE_URL = 'http://127.0.0.1:8000';

export function getAuthHeader() {
  const token = localStorage.getItem('netzero_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchWithAuth(endpoint, options = {}) {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('netzero_token');
    localStorage.removeItem('netzero_user');
    window.dispatchEvent(new Event('netzero_auth_logout'));
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}
