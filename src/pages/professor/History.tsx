import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getSessionHistory } from '../../api/session';
import { manualOverride } from '../../api/attendance';

interface SessionHistory {
  id: string;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  attendances: {
    id: string;
    present: boolean;
    markedAt: string | null;
    manualOverride: boolean;
    user: { id: string; name: string; email: string };
  }[];
}

export function History() {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function fetchHistory() {
    const data = await getSessionHistory();
    setSessions(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  async function handleToggle(sessionId: string, userId: string, currentPresent: boolean) {
    try {
      await manualOverride(sessionId, userId, !currentPresent);
      await fetchHistory();
    } catch (err: any) {
      setError(err?.message || 'Erro ao alterar presença');
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Histórico de Chamadas</h1>
            <p className="mt-0.5 text-sm text-gray-500">Todas as sessões registradas</p>
          </div>
          <Link
            to="/professor"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            ← Voltar
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-400 shadow-sm">
            Nenhuma chamada registrada
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const presentCount = session.attendances.filter((a) => a.present).length;
              return (
                <div key={session.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <button
                    onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50 sm:px-6"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(session.startedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}{' '}— {new Date(session.startedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {presentCount} / {session.attendances.length} presentes
                        {session.isActive && (
                          <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Ativa
                          </span>
                        )}
                      </p>
                    </div>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${expanded === session.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expanded === session.id && (
                    <ul className="divide-y divide-gray-100 border-t border-gray-100">
                      {session.attendances.length === 0 ? (
                        <li className="px-6 py-4 text-center text-sm text-gray-400">
                          Nenhum registro nesta sessão
                        </li>
                      ) : (
                        session.attendances.map((att) => (
                          <li
                            key={att.user.id}
                            className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{att.user.name}</p>
                              <p className="text-xs text-gray-400">{att.user.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge present={att.present} manual={att.manualOverride} />
                              <button
                                onClick={() => handleToggle(session.id, att.user.id, att.present)}
                                className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
                              >
                                {att.present ? 'Marcar ausente' : 'Marcar presente'}
                              </button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
