import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Assessment, Question, User } from '../../types';
import { AppShell } from '../../components/AppShell';

type AssessmentResultRow = {
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

type AssessmentResultsResponse = {
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    totalScore: number;
  };
  rows: AssessmentResultRow[];
};

export const Assessments = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resultsByAssessment, setResultsByAssessment] = useState<Record<string, AssessmentResultsResponse>>({});
  const [resultsLoading, setResultsLoading] = useState<Record<string, boolean>>({});

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Data for modals
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [allCandidates, setAllCandidates] = useState<User[]>([]);
  const [selQuestionIds, setSelQuestionIds] = useState<string[]>([]);
  const [selUserIds, setSelUserIds] = useState<string[]>([]);
  
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [newAsm, setNewAsm] = useState({
    title: '',
    description: '',
    duration: 60,
    passingScore: 50,
  });

  useEffect(() => {
    fetchAssessments();
    fetchQuestions();
    fetchCandidates();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await api.get('/assessments');
      setAssessments(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions');
      setAllQuestions(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/auth/users');
      setAllCandidates(res.data.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selQuestionIds.length === 0) return alert('Select questions');
    setCreating(true);
    try {
      await api.post('/assessments', {
        ...newAsm,
        questions: selQuestionIds.map(id => ({ questionId: id, points: 100 }))
      });
      setIsCreateOpen(false);
      setNewAsm({ title: '', description: '', duration: 60, passingScore: 50 });
      setSelQuestionIds([]);
      fetchAssessments();
    } catch (err) { alert('Failed'); }
    finally { setCreating(false); }
  };

  const handleAssign = async () => {
    if (!selectedAssessment || selUserIds.length === 0) return;
    setAssigning(true);
    try {
      await api.post(`/assessments/${selectedAssessment.id}/assign`, { userIds: selUserIds });
      setIsAssignOpen(false);
      setSelUserIds([]);
      loadResults(selectedAssessment.id);
    } catch (err) { alert('Failed'); }
    finally { setAssigning(false); }
  };

  const loadResults = async (id: string) => {
    setResultsLoading(p => ({ ...p, [id]: true }));
    try {
      const res = await api.get(`/assessments/${id}/results`);
      setResultsByAssessment(p => ({ ...p, [id]: res.data.data }));
    } catch (err) { console.error(err); }
    finally { setResultsLoading(p => ({ ...p, [id]: false })); }
  };

  const toggleResults = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!resultsByAssessment[id]) loadResults(id);
  };

  if (loading) return <AppShell title="Assessments" subtitle="Loading..."><div className="p-10 text-center text-slate-500">Loading...</div></AppShell>;

  return (
    <AppShell title="Assessments" subtitle="Manage your exams." wide>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Assessment Management</h1>
        <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 px-4 py-2 rounded-lg text-white font-bold hover:bg-indigo-500 transition-all">+ Create Test</button>
      </div>

      <div className="space-y-4">
        {assessments.map(a => (
          <div key={a.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{a.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{a.duration} mins • {a.totalScore} pts • Pass: {a.passingScore}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setSelectedAssessment(a); setIsAssignOpen(true); }} className="bg-slate-800 px-4 py-2 rounded-lg text-slate-300 text-sm font-bold hover:text-white transition-all">Assign</button>
                <button onClick={() => toggleResults(a.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${expandedId === a.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Results</button>
              </div>
            </div>

            {expandedId === a.id && (
              <div className="p-6 border-t border-slate-800 bg-slate-950/40">
                {resultsLoading[a.id] ? <div className="text-center py-4 text-slate-500">Loading results...</div> :
                 (resultsByAssessment[a.id]?.rows?.length || 0) === 0 ? <div className="text-center py-4 text-slate-600 italic">No candidates assigned.</div> :
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Security</th>
                          <th className="py-3 px-4">Score</th>
                          <th className="py-3 px-4 text-right">Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {resultsByAssessment[a.id].rows.map(r => (
                          <tr key={r.userAssessmentId} className="hover:bg-slate-800/10">
                            <td className="py-4 px-4 font-bold text-white">{r.candidateName}<div className="text-[11px] font-normal text-slate-500">{r.candidateEmail}</div></td>
                            <td className="py-4 px-4 capitalize"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>{r.status.replace('_', ' ')}</span></td>
                            <td className="py-4 px-4 text-slate-400">{r.tabSwitches} switches</td>
                            <td className="py-4 px-4 font-bold text-white">{r.score} <span className="text-slate-600 font-normal">/ {r.maxScore}</span></td>
                            <td className="py-4 px-4 text-right text-xs text-slate-500">{r.completedAt ? new Date(r.completedAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
                }
              </div>
            )}
          </div>
        ))}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Create Assessment</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Title</label>
                  <input required value={newAsm.title} onChange={e => setNewAsm({...newAsm, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" placeholder="Enter title" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Duration (Min)</label>
                  <input type="number" value={newAsm.duration} onChange={e => setNewAsm({...newAsm, duration: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Passing Score</label>
                  <input type="number" value={newAsm.passingScore} onChange={e => setNewAsm({...newAsm, passingScore: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Select Questions</label>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 h-48 overflow-y-auto space-y-1">
                  {allQuestions.map(q => (
                    <div key={q.id} onClick={() => setSelQuestionIds(p => p.includes(q.id) ? p.filter(i => i !== q.id) : [...p, q.id])} className={`p-3 rounded-xl cursor-pointer transition-all flex justify-between items-center ${selQuestionIds.includes(q.id) ? 'bg-indigo-600/10 border-indigo-500/30 border' : 'hover:bg-slate-900 border border-transparent'}`}>
                      <span className="text-sm font-bold text-slate-300">{q.title}</span>
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${selQuestionIds.includes(q.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-800'}`}>
                        {selQuestionIds.includes(q.id) && <span className="text-[10px] text-white">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button disabled={creating} className="w-full bg-indigo-600 py-4 rounded-2xl text-white font-black hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">{creating ? 'CREATING...' : 'PUBLISH ASSESSMENT'}</button>
            </form>
          </div>
        </div>
      )}

      {isAssignOpen && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Assign: {selectedAssessment.title}</h2>
              <button onClick={() => setIsAssignOpen(false)} className="text-slate-500">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-2">
              {allCandidates.map(u => (
                <div key={u.id} onClick={() => setSelUserIds(p => p.includes(u.id) ? p.filter(i => i !== u.id) : [...p, u.id])} className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${selUserIds.includes(u.id) ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-950 border-slate-800'}`}>
                  <div><div className="font-bold text-white text-sm">{u.fullName}</div><div className="text-[10px] text-slate-500">{u.email}</div></div>
                  <div className={`h-5 w-5 rounded-full border-2 ${selUserIds.includes(u.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-800'}`}>{selUserIds.includes(u.id) && <span className="text-white text-xs block text-center">✓</span>}</div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-950/40 border-t border-slate-800">
               <button disabled={assigning || selUserIds.length === 0} onClick={handleAssign} className="w-full bg-indigo-600 py-3 rounded-xl text-white font-black hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">{assigning ? 'ASSIGNING...' : 'CONFIRM ASSIGNMENT'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};
