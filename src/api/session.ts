const BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

function handleUnauthorized(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

export async function getActiveSession() {
  const res = await fetch(`${BASE}/session/active`, {
    headers: authHeaders(),
  });
  handleUnauthorized(res);
  if (!res.ok) return null;
  return res.json();
}

export async function startSession(lat: number, lng: number) {
  const res = await fetch(`${BASE}/session/start`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ lat, lng }),
  });
  handleUnauthorized(res);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function endSession(sessionId: string) {
  const res = await fetch(`${BASE}/session/${sessionId}/end`, {
    method: 'POST',
    headers: authHeaders(),
  });
  handleUnauthorized(res);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getSessionHistory() {
  const res = await fetch(`${BASE}/session/history`, {
    headers: authHeaders(),
  });
  handleUnauthorized(res);
  if (!res.ok) throw await res.json();
  return res.json();
}
