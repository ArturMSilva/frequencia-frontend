import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getCurrentPosition } from '../../hooks/useGeolocation';
import { getActiveSession, startSession, endSession } from '../../api/session';
import { getAttendanceBySession, manualOverride } from '../../api/attendance';

interface Session {
  id: string;
  startedAt: string;
  isActive: boolean;
}

interface AttendanceEntry {
  student: { id: string; name: string; email: string };
  present: boolean;
  markedAt: string | null;
  manualOverride: boolean;
}

export function ProfessorDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAttendance = useCallback(async (sessionId: string) => {
    const data = await getAttendanceBySession(sessionId);
    setAttendance(data);
  }, []);

  const fetchState = useCallback(async () => {
    const active = await getActiveSession();
    setSession(active);
    if (active) await fetchAttendance(active.id);
    setLoading(false);
  }, [fetchAttendance]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => fetchAttendance(session.id), 30000);
    return () => clearInterval(interval);
  }, [session, fetchAttendance]);

  async function handleStart() {
    setError('');
    setActionLoading(true);
    try {
      const coords = await getCurrentPosition();
      const newSession = await startSession(coords.latitude, coords.longitude);
      setSession(newSession);
      setAttendance([]);
      await fetchAttendance(newSession.id);
    } catch (err: any) {
      setError(err?.message || 'Erro ao iniciar chamada');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRefresh() {
    if (!session) return;
    setRefreshing(true);
    try {
      await fetchAttendance(session.id);
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar lista');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleEnd() {
    if (!session) return;
    setActionLoading(true);
    try {
      await endSession(session.id);
      setSession((s) => (s ? { ...s, isActive: false } : null));
    } catch (err: any) {
      setError(err?.message || 'Erro ao encerrar chamada');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTogglePresence(entry: AttendanceEntry) {
    if (!session) return;
    try {
      await manualOverride(session.id, entry.student.id, !entry.present);
      await fetchAttendance(session.id);
    } catch (err: any) {
      setError(err?.message || 'Erro ao alterar presença');
    }
  }

  const presentCount = attendance.filter((a) => a.present).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Controle de Chamada</h1>
            <p className="mt-0.5 text-sm text-gray-500">Gerencie a presença dos alunos</p>
          </div>
          <Link
            to="/professor/historico"
            className="self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            Ver histórico
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    session?.isActive ? 'animate-pulse bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="font-semibold text-gray-900">
                  {session?.isActive
                    ? 'Chamada ativa'
                    : session
                      ? 'Chamada encerrada'
                      : 'Nenhuma chamada ativa'}
                </span>
              </div>
              {session?.startedAt && (
                <p className="mt-1 text-sm text-gray-500">
                  Iniciada às{' '}
                  {new Date(session.startedAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            {!session?.isActive ? (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="w-full rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50 sm:w-auto"
              >
                {actionLoading ? 'Aguarde...' : 'Iniciar Chamada'}
              </button>
            ) : (
              <button
                onClick={handleEnd}
                disabled={actionLoading}
                className="w-full rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 sm:w-auto"
              >
                {actionLoading ? 'Encerrando...' : 'Encerrar Chamada'}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : session ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-gray-900">Lista de presença</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg
                    className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-green-600">{presentCount}</span>
                  {' / '}
                  {attendance.length} presentes
                </span>
              </div>
            </div>

            {attendance.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                Nenhum aluno cadastrado
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {attendance.map((entry) => (
                  <li
                    key={entry.student.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.student.name}</p>
                      <p className="text-xs text-gray-400">{entry.student.email}</p>
                      {entry.markedAt && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {new Date(entry.markedAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge present={entry.present} manual={entry.manualOverride} />
                      <button
                        onClick={() => handleTogglePresence(entry)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
                      >
                        {entry.present ? 'Marcar ausente' : 'Marcar presente'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
