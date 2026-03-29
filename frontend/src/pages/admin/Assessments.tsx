import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Assessment, Question, User } from '../../types';

type ResultRow = {
  userAssessmentId: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  score: number;
  maxScore: number;
  passed: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
  tabSwitches: number;
};

type ResultsData = {
  assessment: { id: string; title: string; passingScore: number; totalScore: number };
  rows: ResultRow[];
};

// ─── tiny helpers ────────────────────────────────────────────────────────────
const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : '—');

const Badge = ({ status }: { status: string }) => {
  const s = status.replace(/_/g, ' ');
  const cls =
    status === 'completed'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : status === 'in_progress'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-slate-700/60 text-slate-400 border-slate-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cls}`}>
      {s}
    </span>
  );
};

// ─── Modal wrapper ────────────────────────────────────────────────────────────
const Modal = ({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div
      className={`bg-[#0f1117] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full ${
        wide ? 'max-w-2xl' : 'max-w-md'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
export const Assessments = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // scoreboard
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ResultsData>>({});
  const [resultsLoading, setResultsLoading] = useState<Record<string, boolean>>({});

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selQIds, setSelQIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration: 60, passingScore: 50 });

  // assign modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Assessment | null>(null);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [selUserIds, setSelUserIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadAssessments();
    loadQuestions();
    loadCandidates();
  }, []);

  const loadAssessments = async () => {
    try {
      const r = await api.get('/assessments');
      setAssessments(r.data.data ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const r = await api.get('/questions');
      setAllQuestions(r.data.data ?? []);
    } catch {/* */}
  };

  const loadCandidates = async () => {
    try {
      const r = await api.get('/auth/users');
      setCandidates(r.data.data ?? []);
    } catch {/* */}
  };

  const loadResults = async (id: string) => {
    setResultsLoading(p => ({ ...p, [id]: true }));
    try {
      const r = await api.get(`/assessments/${id}/results`);
      setResults(p => ({ ...p, [id]: r.data.data }));
    } catch {/* */} finally {
      setResultsLoading(p => ({ ...p, [id]: false }));
    }
  };

  const toggleScoreboard = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!results[id]) loadResults(id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selQIds.length) return alert('Pick at least one question.');
    setCreating(true);
    try {
      await api.post('/assessments', {
        ...form,
        questions: selQIds.map(id => ({ questionId: id, points: 100 })),
      });
      setShowCreate(false);
      setForm({ title: '', description: '', duration: 60, passingScore: 50 });
      setSelQIds([]);
      loadAssessments();
    } catch { alert('Failed to create. Check console.'); }
    finally { setCreating(false); }
  };

  const openAssign = (a: Assessment) => {
    setAssignTarget(a);
    setSelUserIds([]);
    setShowAssign(true);
  };

  const handleAssign = async () => {
    if (!assignTarget || !selUserIds.length) return;
    setAssigning(true);
    try {
      await api.post(`/assessments/${assignTarget.id}/assign`, { userIds: selUserIds });
      setShowAssign(false);
      // refresh scoreboard if open
      if (expandedId === assignTarget.id) loadResults(assignTarget.id);
    } catch { alert('Assignment failed.'); }
    finally { setAssigning(false); }
  };

  const toggleQ = (id: string) =>
    setSelQIds(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  const toggleU = (id: string) =>
    setSelUserIds(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Assessments</h1>
            <p className="text-sm text-slate-500 mt-1">Create tests, assign candidates, and track results.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <span className="text-lg leading-none">+</span>
            Create Assessment
          </button>
        </div>

        {/* Assessment list */}
        {loading ? (
          <div className="py-20 text-center text-slate-600 animate-pulse">Loading assessments…</div>
        ) : assessments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 py-20 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-slate-400 font-semibold">No assessments yet</p>
            <p className="text-slate-600 text-sm mt-1">Click "Create Assessment" to get started</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all"
            >
              Create your first assessment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map(a => (
              <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">

                {/* Card header */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{a.title}</h3>
                    {a.description && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{a.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-600">⏱</span> {a.duration} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-600">🏆</span> {a.totalScore ?? 0} pts
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-600">✅</span> Pass: {a.passingScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openAssign(a)}
                      className="text-sm font-bold px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all"
                    >
                      Assign Students
                    </button>
                    <button
                      onClick={() => toggleScoreboard(a.id)}
                      className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                        expandedId === a.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {expandedId === a.id ? 'Hide Results' : 'View Results'}
                    </button>
                  </div>
                </div>

                {/* Scoreboard */}
                {expandedId === a.id && (
                  <div className="border-t border-slate-800">
                    {resultsLoading[a.id] ? (
                      <div className="py-10 text-center text-slate-600 animate-pulse">Loading results…</div>
                    ) : !results[a.id] || results[a.id].rows.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-slate-500">No candidates assigned yet.</p>
                        <button
                          onClick={() => openAssign(a)}
                          className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-bold"
                        >
                          Assign now →
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[11px] font-bold uppercase tracking-widest text-slate-600 border-b border-slate-800">
                              <th className="px-6 py-3 text-left">Candidate</th>
                              <th className="px-6 py-3 text-left">Status</th>
                              <th className="px-6 py-3 text-left">Tab Switches</th>
                              <th className="px-6 py-3 text-left">Score</th>
                              <th className="px-6 py-3 text-left">Result</th>
                              <th className="px-6 py-3 text-right">Completed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {results[a.id].rows.map(r => (
                              <tr key={r.userAssessmentId} className="hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-white">{r.candidateName}</div>
                                  <div className="text-xs text-slate-500">{r.candidateEmail}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge status={r.status} />
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`font-bold ${r.tabSwitches >= 2 ? 'text-red-400' : r.tabSwitches === 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {r.tabSwitches}
                                    {r.tabSwitches >= 2 && <span className="ml-1 text-[10px]">⚠</span>}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-white">
                                  {r.score}
                                  <span className="text-slate-600 font-normal"> / {r.maxScore}</span>
                                </td>
                                <td className="px-6 py-4">
                                  {r.status === 'completed' ? (
                                    r.passed
                                      ? <span className="text-emerald-400 font-bold text-xs">PASSED</span>
                                      : <span className="text-red-400 font-bold text-xs">FAILED</span>
                                  ) : <span className="text-slate-600 text-xs">—</span>}
                                </td>
                                <td className="px-6 py-4 text-right text-xs text-slate-500">
                                  {fmt(r.completedAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Assessment Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Create Assessment" onClose={() => setShowCreate(false)} wide>
          <form onSubmit={handleCreate} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Title *
              </label>
              <input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Backend Engineering Round 1"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional instructions for candidates…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Duration + Passing Score */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={360}
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Passing Score
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.passingScore}
                  onChange={e => setForm({ ...form, passingScore: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Question picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Questions *
                </label>
                <span className="text-xs text-slate-600">
                  {selQIds.length} selected
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-800">
                {allQuestions.length === 0 ? (
                  <p className="px-4 py-6 text-center text-slate-600 text-sm">No questions found.</p>
                ) : (
                  allQuestions.map(q => {
                    const sel = selQIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => toggleQ(q.id)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${sel ? 'bg-indigo-600/10' : 'hover:bg-slate-800'}`}
                      >
                        <div>
                          <span className="text-sm font-semibold text-slate-200">{q.title}</span>
                          <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                            q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>{q.difficulty}</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700'}`}>
                          {sel && <span className="text-white text-[10px]">✓</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              {creating ? 'Creating…' : '🚀 Publish Assessment'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Assign Students Modal ──────────────────────────────────────────── */}
      {showAssign && assignTarget && (
        <Modal title={`Assign: ${assignTarget.title}`} onClose={() => setShowAssign(false)}>
          <div className="p-6 space-y-3">
            {candidates.length === 0 ? (
              <p className="text-center text-slate-500 py-6 text-sm">No candidates registered yet.</p>
            ) : (
              candidates.map(u => {
                const sel = selUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleU(u.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      sel ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white text-sm">{u.fullName}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700'}`}>
                      {sel && <span className="text-white text-[10px]">✓</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-6 pb-6">
            <button
              onClick={handleAssign}
              disabled={assigning || selUserIds.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              {assigning ? 'Assigning…' : `Assign to ${selUserIds.length || ''} Student${selUserIds.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
