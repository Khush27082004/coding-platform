import { useState, useEffect } from 'react';
import api from '../../services/api';
import { AppShell } from '../../components/AppShell';

export const Submissions = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionsRes] = await Promise.all([
          api.get('/submissions/history')
        ]);
        setSubmissions(submissionsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch submissions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-zinc-900 text-white border-zinc-900';
      case 'running':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      case 'error':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-zinc-50 text-zinc-400 border-zinc-100';
    }
  };

  if (loading) {
    return (
      <AppShell title="Submission History" subtitle="Synchronizing execution records…">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Accessing logs…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      title="Submission archive" 
      subtitle="Historical record of all evaluated solution attempts across the platform." 
      wide
    >
      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/30 py-24 text-center shadow-inner">
          <p className="text-zinc-300 text-[10px] font-black uppercase tracking-widest italic">Zero submission events recorded</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-zinc-50/30">
                  <th className="px-6 py-5">Question Asset</th>
                  <th className="px-6 py-5">Runtime ENV</th>
                  <th className="px-6 py-5">Execution Status</th>
                  <th className="px-6 py-5">Score Matrix</th>
                  <th className="px-6 py-5">Latency</th>
                  <th className="px-6 py-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="text-zinc-600 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-zinc-900 uppercase tracking-tighter">{sub.question?.title || 'GENERAL_DEBUG'}</td>
                    <td className="px-6 py-5 font-bold uppercase tracking-widest text-zinc-400">{sub.language}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-black tabular-nums text-zinc-900">
                      {sub.score} <span className="text-zinc-300 font-bold ml-0.5">/ {sub.maxScore}</span>
                    </td>
                    <td className="px-6 py-5 text-zinc-400 font-bold uppercase tracking-wider">{sub.executionTime != null ? `${sub.executionTime} MS` : '---'}</td>
                    <td className="px-6 py-5 text-right text-zinc-400 font-bold uppercase tracking-widest text-[9px] whitespace-nowrap">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
};
