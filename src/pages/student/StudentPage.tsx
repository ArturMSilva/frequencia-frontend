import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { getCurrentPosition } from '../../hooks/useGeolocation';
import { getActiveSession } from '../../api/session';
import { respondAttendance } from '../../api/attendance';

interface Session {
  id: string;
  startedAt: string;
  isActive: boolean;
}

type Status = 'idle' | 'no-session' | 'loading' | 'success' | 'error' | 'geo-denied';

export function StudentPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [markedAt, setMarkedAt] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setStatus((prev) => {
      if (prev === 'success') return 'success';
      return 'loading';
    });
    const active = await getActiveSession();
    if (!active) {
      setStatus((prev) => (prev === 'success' ? 'success' : 'no-session'));
      setSession(null);
    } else {
      setSession(active);
      setStatus((prev) => (prev === 'success' ? 'success' : 'idle'));
    }
  }

  useEffect(() => {
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleRespond() {
    if (!session) return;
    setStatus('loading');
    setMessage('');
    try {
      const coords = await getCurrentPosition();
      await respondAttendance(coords.latitude, coords.longitude);
      setStatus('success');
      setMarkedAt(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      );
    } catch (err: any) {
      if (err?.message?.includes('Habilite') || err?.message?.includes('negada')) {
        setStatus('geo-denied');
        setMessage(err.message);
      } else {
        setStatus('error');
        setMessage(err?.message || 'Erro ao registrar presença');
      }
    }
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center pt-8 sm:pt-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Chamada</h1>
            <p className="mt-1 text-sm text-gray-500">Registre sua presença quando solicitado</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                <p className="text-sm text-gray-500">Verificando chamada...</p>
              </div>
            )}

            {status === 'no-session' && (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800">Nenhuma chamada ativa</p>
                <p className="text-sm text-gray-500">Aguarde o professor liberar a chamada</p>
              </div>
            )}

            {status === 'idle' && (
              <div className="space-y-5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Chamada aberta</p>
                  {session && (
                    <p className="mt-1 text-sm text-gray-500">
                      Iniciada às{' '}
                      {new Date(session.startedAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleRespond}
                  className="w-full rounded-xl bg-blue-700 py-4 text-base font-semibold text-white transition hover:bg-blue-800 active:scale-95"
                >
                  Responder Chamada
                </button>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-green-700">Chamada respondida!</p>
                {markedAt && <p className="text-sm text-gray-500">Presença registrada às {markedAt}</p>}
              </div>
            )}

            {status === 'geo-denied' && (
              <div className="space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                  <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800">Localização necessária</p>
                <p className="text-sm text-gray-500">{message}</p>
                <button
                  onClick={handleRespond}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm text-gray-600 transition hover:bg-gray-50"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800">Não foi possível registrar</p>
                <p className="text-sm text-gray-500">{message}</p>
                <button
                  onClick={handleRespond}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm text-gray-600 transition hover:bg-gray-50"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
