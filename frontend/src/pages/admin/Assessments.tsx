import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Assessment, Question } from '../../types';
import { AppShell } from '../../components/AppShell';
import { Plus, Search, Pencil, ClipboardList, ChevronDown, ChevronUp, X } from 'lucide-react';

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

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : '—');

const StatusBadge = ({ status }: { status: string }) => {
  const s = status.replace(/_/g, ' ');
  const cls =
    status === 'completed'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : status === 'in_progress'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-slate-700/60 text-slate-400 border-slate-700';
  return (
    <span className={`badge border ${cls}`}>{s}</span>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
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
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
    <div
      className={`bg-[#0d1424] border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full ${
        wide ? 'max-w-2xl' : 'max-w-lg'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  </div>
);

// ── Form field components ──────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export const Assessments = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ResultsData>>({});
  const [resultsLoading, setResultsLoading] = useState<Record<string, boolean>>({});

  const filteredAssessments = assessments.filter(a =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [showCreate, setShowCreate] = useState(false);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selQIds, setSelQIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration: 60, passingScore: 50, isActive: true });

  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Assessment | null>(null);
  const [editSelQIds, setEditSelQIds] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', duration: 60, passingScore: 50, isActive: true });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadAssessments(), loadQuestions()]);
      } catch (err) {
        console.error('Initial load failed', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadAssessments = async () => {
    try {
      const r = await api.get('/assessments');
      setAssessments(r.data.data ?? []);
    } catch { /* ignore */ }
  };

  const loadQuestions = async () => {
    try {
      const r = await api.get('/questions');
      setAllQuestions(r.data.data ?? []);
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
      setForm({ title: '', description: '', duration: 60, passingScore: 50, isActive: true });
      setSelQIds([]);
      loadAssessments();
    } catch { alert('Failed to create. Check console.'); }
    finally { setCreating(false); }
  };

  const openEdit = async (a: Assessment) => {
    setEditTarget(a);
    setEditForm({
      title: a.title || '',
      description: a.description || '',
      duration: a.duration || 60,
      passingScore: a.passingScore || 0,
      isActive: a.isActive ?? true,
    });
    setEditSelQIds([]);
    setLoadingQuestions(true);
    setShowEdit(true);
    try {
      const r = await api.get(`/assessments/${a.id}`);
      const aqs = r.data.data.assessmentQuestions || [];
      setEditSelQIds(aqs.map((aq: any) => aq.questionId));
    } catch {
      setEditSelQIds([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);
    try {
      await api.put(`/assessments/${editTarget.id}`, {
        ...editForm,
        questions: editSelQIds.map(id => ({ questionId: id, points: 100 })),
      });
      setShowEdit(false);
      loadAssessments();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Edit failed. Check console.');
    }
    finally { setEditing(false); }
  };

  const toggleQ = (id: string) =>
    setSelQIds(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  const toggleEditQ = (id: string) => {
    if (editForm.isActive) return;
    setEditSelQIds(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  };

  // ── Shared form content ──────────────────────────────────────────────────────
  const FormFields = ({
    f,
    setF,
    qIds,
    toggleFn,
    isEdit,
  }: {
    f: typeof form;
    setF: (v: typeof form) => void;
    qIds: string[];
    toggleFn: (id: string) => void;
    isEdit?: boolean;
  }) => (
    <div className="p-6 space-y-5">
      <Field label="Title *">
        <input
          required
          value={f.title}
          onChange={e => setF({ ...f, title: e.target.value })}
          placeholder="e.g. Backend Engineering Round 1"
          className="input-dark"
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={2}
          value={f.description}
          onChange={e => setF({ ...f, description: e.target.value })}
          placeholder="Optional instructions for candidates…"
          className="input-dark resize-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Duration (min)">
          <input
            type="number"
            min={5}
            max={360}
            value={f.duration}
            onChange={e => setF({ ...f, duration: parseInt(e.target.value) || 60 })}
            className="input-dark"
          />
        </Field>
        <Field label="Passing Score">
          <input
            type="number"
            min={0}
            value={f.passingScore}
            onChange={e => setF({ ...f, passingScore: parseInt(e.target.value) || 0 })}
            className="input-dark"
          />
        </Field>
      </div>

      {/* Question picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Questions {!isEdit && '*'}
          </label>
          <span className="text-xs text-slate-500">
            {loadingQuestions ? 'Loading…' : `${qIds.length} selected`}
          </span>
        </div>
        <div className={`bg-slate-900/80 border rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-800/60 ${
          isEdit && (f.isActive || loadingQuestions) ? 'border-slate-800 opacity-60' : 'border-slate-700'
        }`}>
          {loadingQuestions ? (
            <div className="px-4 py-8 text-center">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Fetching questions…</p>
            </div>
          ) : allQuestions.length === 0 ? (
            <p className="px-4 py-6 text-center text-slate-600 text-sm">No questions found.</p>
          ) : (
            allQuestions.map(q => {
              const sel = qIds.includes(q.id);
              const disabled = isEdit && (f.isActive || loadingQuestions);
              return (
                <div
                  key={q.id}
                  onClick={() => !disabled && toggleFn(q.id)}
                  className={`flex items-center justify-between px-4 py-3 transition-colors ${
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/50'
                  } ${sel && !disabled ? 'bg-indigo-600/8' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      sel ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'
                    }`}>
                      {sel && <span className="text-white text-[10px] leading-none">✓</span>}
                    </div>
                    <span className="text-sm text-slate-200 font-medium truncate">{q.title}</span>
                    <span className={`badge shrink-0 ${
                      q.difficulty === 'easy' ? 'badge-easy' :
                      q.difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
                    }`}>{q.difficulty}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {isEdit && f.isActive && !loadingQuestions && (
          <p className="text-[10px] text-amber-400/80 mt-1.5">
            🔒 Questions are locked while the test is Active. Switch to Inactive to edit.
          </p>
        )}
      </div>

      {/* Active toggle */}
      <label className={`flex items-center gap-3 p-4 border rounded-xl transition-all cursor-pointer ${
        f.isActive ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-600'
      }`}>
        <div className="relative flex items-center shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            checked={f.isActive}
            disabled={isEdit && loadingQuestions}
            onChange={e => setF({ ...f, isActive: e.target.checked })}
          />
          <div className={`w-10 h-6 rounded-full transition-colors ${f.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform ${f.isActive ? 'translate-x-4' : ''}`} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-none">Assessment Active</div>
          <div className="text-xs text-slate-500 mt-0.5">Candidates can view and start this test.</div>
        </div>
      </label>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AppShell
      title="Assessments"
      subtitle="Create tests, assign candidates, and track results."
      actions={
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} />
          Create Assessment
        </button>
      }
    >
      <div className="space-y-4 animate-fade-in">
        {/* Search */}
        {!loading && assessments.length > 0 && (
          <div className="relative max-w-sm group">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search assessments…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark pl-10 text-sm"
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-slate-800 p-5 space-y-3">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-64 rounded" />
              </div>
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <div className="empty-state">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <ClipboardList size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">No assessments yet</p>
            <p className="text-slate-600 text-xs mt-1">Click "Create Assessment" to get started</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-xs">
              <Plus size={14} /> Create Assessment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map(a => (
              <div key={a.id} className="card overflow-hidden">
                {/* Card header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{a.title}</h3>
                      {a.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 badge bg-slate-700/50 text-slate-500 border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          Inactive
                        </span>
                      )}
                    </div>
                    {a.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{a.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <span>⏱ {a.duration} min</span>
                      <span>🏆 {a.totalScore ?? 0} pts</span>
                      <span>✅ Pass: {a.passingScore}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(a)}
                      className="btn-ghost text-xs gap-1.5"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleScoreboard(a.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        expandedId === a.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {expandedId === a.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      Results
                    </button>
                  </div>
                </div>

                {/* Scoreboard */}
                {expandedId === a.id && (
                  <div className="border-t border-slate-800">
                    {resultsLoading[a.id] ? (
                      <div className="py-10 text-center">
                        <div className="w-6 h-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-slate-600 text-xs">Loading results…</p>
                      </div>
                    ) : !results[a.id] || results[a.id].rows.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-slate-500 text-sm">No candidates have started this assessment yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Candidate</th>
                              <th>Status</th>
                              <th>Tab Switches</th>
                              <th>Score</th>
                              <th>Result</th>
                              <th className="text-right">Completed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results[a.id].rows.map(r => (
                              <tr key={r.userAssessmentId}>
                                <td>
                                  <div className="font-semibold text-white text-xs">{r.candidateName}</div>
                                  <div className="text-[11px] text-slate-600">{r.candidateEmail}</div>
                                </td>
                                <td><StatusBadge status={r.status} /></td>
                                <td>
                                  <span className={`font-bold text-xs ${r.tabSwitches >= 2 ? 'text-red-400' : r.tabSwitches === 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {r.tabSwitches}
                                    {r.tabSwitches >= 2 && <span className="ml-1">⚠</span>}
                                  </span>
                                </td>
                                <td className="font-bold text-white text-xs">
                                  {r.score}<span className="text-slate-600 font-normal"> / {r.maxScore}</span>
                                </td>
                                <td>
                                  {r.status === 'completed' ? (
                                    r.passed
                                      ? <span className="text-emerald-400 font-bold text-xs">PASSED</span>
                                      : <span className="text-red-400 font-bold text-xs">FAILED</span>
                                  ) : <span className="text-slate-600 text-xs">—</span>}
                                </td>
                                <td className="text-right text-[11px] text-slate-500">{fmt(r.completedAt)}</td>
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

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Assessment" onClose={() => setShowCreate(false)} wide>
          <form onSubmit={handleCreate}>
            <FormFields f={form} setF={setForm} qIds={selQIds} toggleFn={toggleQ} />
            <div className="px-6 pb-6">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary w-full py-3"
              >
                {creating ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                ) : '🚀 Publish Assessment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && editTarget && (
        <Modal title={`Edit: ${editTarget.title}`} onClose={() => setShowEdit(false)} wide>
          <form onSubmit={handleEdit}>
            <FormFields f={editForm} setF={setEditForm} qIds={editSelQIds} toggleFn={toggleEditQ} isEdit />
            <div className="px-6 pb-6">
              <button
                type="submit"
                disabled={editing || loadingQuestions}
                className="btn-primary w-full py-3"
              >
                {editing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                ) : loadingQuestions ? 'Loading…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
};
