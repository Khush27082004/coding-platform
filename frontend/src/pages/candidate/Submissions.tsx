import { useState, useEffect } from 'react';
import api from '../../services/api';
import { AppShell } from '../../components/AppShell';
import { History } from 'lucide-react';

export const Submissions = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionsRes] = await Promise.all([
          api.get('/submissions/history')
        ]);
        setSubmissions(submissionsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch submissions', error);
        setError('Failed to load submission history.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusConfig: Record<string, { cls: string; dot: string }> = {
    completed: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    running:   { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',          dot: 'bg-blue-400 animate-pulse' },
    error:     { cls: 'bg-red-500/10 text-red-400 border-red-500/20',             dot: 'bg-red-400' },
  };

  const getStatus = (s: string) => statusConfig[s] ?? { cls: 'bg-slate-700/50 text-slate-400 border-slate-700', dot: 'bg-slate-500' };

  if (loading) {
    return (
      <AppShell title="Submission History" subtitle="Synchronizing execution records…" wide>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-800">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-5 w-20 rounded-full ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Submission Archive"
      subtitle="Historical record of all evaluated solution attempts across the platform."
      wide
    >
      <div className="animate-fade-in">
        {error ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-400">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <History size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">No submissions yet</p>
            <p className="text-slate-600 text-xs mt-1">Complete your first practice problem to see results here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Latency</th>
                    <th className="text-right">Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const s = getStatus(sub.status);
                    return (
                      <tr key={sub.id}>
                        <td>
                          <span className="font-semibold text-slate-200 text-xs">
                            {sub.question?.title || 'General Debug'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-slate-700/50 text-slate-400 border-slate-700">
                            {sub.language}
                          </span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 badge border ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-white text-xs tabular-nums">
                            {sub.score}
                          </span>
                          <span className="text-slate-600 text-xs font-normal"> / {sub.maxScore}</span>
                        </td>
                        <td className="text-xs">
                          {sub.executionTime != null ? `${sub.executionTime} ms` : '—'}
                        </td>
                        <td className="text-right text-[11px] whitespace-nowrap">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-600">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} total
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
