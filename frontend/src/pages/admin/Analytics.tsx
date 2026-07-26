import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { AppShell } from '../../components/AppShell';
import { RefreshCw, BookOpen, ClipboardList, Send, TrendingUp, Search } from 'lucide-react';

type ResultRow = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  assessmentTitle: string;
  questionTitle: string;
  status: string;
  score: number;
  maxScore: number;
  passedTests: number;
  totalTests: number;
  passed: boolean;
  submittedAt: string;
  language: string;
  isPractice: boolean;
};

export const Analytics = () => {
  const [stats, setStats] = useState({ totalQuestions: 0, totalAssessments: 0 });
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const res = await api.get('/submissions/all');
      setRows(res.data.data || []);
      setLastRefreshed(new Date());
    } catch {
      setRows([]);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [qRes, aRes] = await Promise.all([api.get('/questions'), api.get('/assessments')]);
        const assessmentData = aRes.data.data || [];
        setStats({
          totalQuestions: qRes.data.pagination?.total || qRes.data.data.length,
          totalAssessments: assessmentData.length,
        });
        await fetchAllResults();
      } catch {
        setResultsLoading(false);
      }
    })();
  }, [fetchAllResults]);

  const fmt = (v?: string | null) =>
    v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const filteredRows = rows.filter((r) => {
    const matchFilter = filter === 'all' || (filter === 'passed' ? r.passed : !r.passed);
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      r.candidateName.toLowerCase().includes(q) ||
      r.candidateEmail.toLowerCase().includes(q) ||
      r.assessmentTitle.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const passCount = rows.filter((r) => r.passed).length;
  const avgScore =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) / rows.length)
      : 0;

  const statCards = [
    {
      label: 'Questions',
      value: stats.totalQuestions,
      icon: <BookOpen size={18} />,
      color: 'emerald',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/15',
    },
    {
      label: 'Assessments',
      value: stats.totalAssessments,
      icon: <ClipboardList size={18} />,
      color: 'sky',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/15',
    },
    {
      label: 'Submissions',
      value: rows.length,
      icon: <Send size={18} />,
      color: 'violet',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/15',
    },
    {
      label: 'Pass Rate',
      value: rows.length > 0 ? `${Math.round((passCount / rows.length) * 100)}%` : '—',
      icon: <TrendingUp size={18} />,
      color: 'amber',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/15',
    },
  ];

  return (
    <AppShell
      title="Overview"
      subtitle="Platform snapshot and all candidate scores."
      wide
      actions={
        <button
          type="button"
          onClick={() => fetchAllResults()}
          disabled={resultsLoading}
          className="btn-ghost text-xs gap-2"
        >
          <RefreshCw size={14} className={resultsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`card p-5 flex items-start gap-4`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg} border ${s.border}`}>
                <span className={s.text}>{s.icon}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${s.text}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="card overflow-hidden">
          {/* Table header with controls */}
          <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Candidate Scoreboard</h2>
              {lastRefreshed && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Updated {lastRefreshed.toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 sm:ml-auto flex-wrap">
              {/* Search */}
              <div className="relative group">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate or assessment…"
                  className="input-dark pl-8 text-xs py-2 w-52"
                />
              </div>

              {/* Filter pills */}
              <div className="flex rounded-xl border border-slate-800 overflow-hidden">
                {(['all', 'passed', 'failed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      filter === f
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table content */}
          {resultsLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Loading scores…</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              {rows.length === 0
                ? 'No submissions yet. Assign tests and have candidates submit.'
                : 'No results match your filter.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Context</th>
                    <th>Question</th>
                    <th>Status</th>
                    <th>Tests Passed</th>
                    <th>Score</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const pct = row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0;
                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="font-semibold text-white text-xs">{row.candidateName}</div>
                          <div className="text-[11px] text-slate-600">{row.candidateEmail}</div>
                        </td>
                        <td>
                          <span
                            className={`badge border ${
                              row.isPractice
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            }`}
                          >
                            {row.assessmentTitle}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs text-slate-300 font-medium">{row.questionTitle}</div>
                          <div className="text-[10px] text-slate-600 uppercase mt-0.5">{row.language}</div>
                        </td>
                        <td>
                          <span
                            className={`badge border ${
                              row.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : row.status === 'error'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 tabular-nums">
                              {row.passedTests}/{row.totalTests}
                            </span>
                          </div>
                        </td>
                        <td className="tabular-nums">
                          <span className="text-white font-semibold text-xs">{row.score}</span>
                          <span className="text-slate-600 text-xs">/{row.maxScore}</span>
                        </td>
                        <td className="text-[11px] whitespace-nowrap">{fmt(row.submittedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
                <span>{filteredRows.length} of {rows.length} entries</span>
                <span>
                  Avg score:{' '}
                  <span className="text-slate-300 font-semibold">{avgScore}%</span>
                  {' · '}Passed:{' '}
                  <span className="text-emerald-400 font-semibold">{passCount}</span>
                  {' · '}Failed:{' '}
                  <span className="text-rose-400 font-semibold">{rows.length - passCount}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
