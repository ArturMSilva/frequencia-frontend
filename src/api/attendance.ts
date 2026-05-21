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

export async function respondAttendance(lat: number, lng: number) {
  const res = await fetch(`${BASE}/attendance/respond`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ lat, lng }),
  });
  handleUnauthorized(res);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateLocation(sessionId: string, lat: number, lng: number) {
  const res = await fetch(`${BASE}/attendance/location`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ sessionId, lat, lng }),
  });
  handleUnauthorized(res);
}

export async function getAttendanceBySession(sessionId: string) {
  const res = await fetch(`${BASE}/attendance/session/${sessionId}`, {
    headers: authHeaders(),
  });
  handleUnauthorized(res);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function manualOverride(sessionId: string, userId: string, present: boolean) {
  const res = await fetch(
    `${BASE}/attendance/session/${sessionId}/user/${userId}/manual`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ present }),
    },
  );
  handleUnauthorized(res);
  if (!res.ok) throw await res.json();
  return res.json();
}
