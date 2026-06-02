import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { AppShell } from '../components/AppShell';

type AssignedAssessment = {
  id: string;
  title: string;
  description?: string;
  duration: number;
  totalScore?: number;
  userAssessments?: { status: string; score?: number }[];
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assigned, setAssigned] = useState<AssignedAssessment[]>([]);
  const [loadingTests, setLoadingTests] = useState(user?.role === 'candidate');
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'candidate') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/assessments');
        if (!cancelled) setAssigned(res.data.data || []);
      } catch {
        if (!cancelled) setAssigned([]);
      } finally {
        if (!cancelled) setLoadingTests(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (user?.role === 'admin') {
    return (
      <AppShell
        title="Command center"
        subtitle="Orchestrate your questions, assessments, and candidate analytics."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => navigate('/admin/questions')}
            className="group text-left rounded-2xl border border-zinc-200 bg-white p-8 hover:border-zinc-900 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 group-hover:text-zinc-900 transition-colors">Question Bank</div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
              Questions
            </h2>
            <p className="mt-3 text-sm text-zinc-500 font-medium">Curate and manage your collection of coding challenges.</p>
            <div className="mt-8 flex items-center text-xs font-black text-zinc-900 gap-1 opacity-0 group-hover:opacity-100 transition-all">
              Manage Collection <span className="text-lg">→</span>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/admin/assessments')}
            className="group text-left rounded-2xl border border-zinc-200 bg-white p-8 hover:border-zinc-900 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 group-hover:text-zinc-900 transition-colors">Test Logistics</div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
              Assessments
            </h2>
            <p className="mt-3 text-sm text-zinc-500 font-medium">Schedule evaluations and monitor candidate performance.</p>
            <div className="mt-8 flex items-center text-xs font-black text-zinc-900 gap-1 opacity-0 group-hover:opacity-100 transition-all">
              Evaluation Center <span className="text-lg">→</span>
            </div>
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Session: ${user?.fullName?.split(' ')[0] || 'Member'}`}
      subtitle="Access your active assessments and skill development tools."
    >
      <div className="space-y-12">
        <section>
          <div className="flex items-center justify-between gap-4 mb-6 border-b border-zinc-100 pb-4">
            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Assigned Evaluations</h2>
            <div className="h-1 flex-1 bg-zinc-50 rounded-full ml-4 hidden sm:block" />
          </div>

          {loadingTests ? (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-12 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              Synchronizing assessments…
            </div>
          ) : assigned.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center shadow-inner">
              <p className="text-zinc-400 text-sm font-bold uppercase tracking-wide">No pending tests</p>
              <p className="text-zinc-300 text-[10px] mt-2 font-bold uppercase tracking-widest">Awaiting administrator assignment</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {assigned.map((a) => {
                const ua = a.userAssessments?.[0];
                const rawStatus = ua?.status || 'not_started';
                const statusLabel = rawStatus.replace('_', ' ');
                const isCompleted = rawStatus === 'completed';
                
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase">{a.title}</h3>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                          isCompleted ? 'bg-zinc-100 text-zinc-400 border-zinc-200' : 'bg-zinc-900 text-white border-zinc-900'
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                      {a.description && (
                        <p className="mt-2 text-sm text-zinc-500 font-medium line-clamp-2">{a.description}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1">🕒 {a.duration} MIN</span>
                        {a.totalScore != null && <span className="flex items-center gap-1">💎 {a.totalScore} PTS</span>}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        if (isCompleted) {
                          navigate('/submissions');
                        } else {
                          setStartingId(a.id);
                          try {
                            const res = await api.post(`/assessments/${a.id}/start`);
                            const ua = res.data.data;
                            const firstAQ = ua.assessment.assessmentQuestions[0];
                            if (firstAQ) {
                              navigate(`/practice/${firstAQ.questionId}?userAssessmentId=${ua.id}`);
                            } else {
                              alert('This assessment has no questions.');
                            }
                          } catch (err: any) {
                            alert(err.response?.data?.error?.message || 'Failed to initialize assessment');
                          } finally {
                            setStartingId(null);
                          }
                        }
                      }}
                      disabled={isCompleted || startingId === a.id}
                      className={`mt-6 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg ${
                        isCompleted
                          ? 'bg-white border border-zinc-200 text-zinc-400 hover:bg-zinc-50 shadow-none'
                          : startingId === a.id 
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200'
                      }`}
                    >
                      {startingId === a.id ? (
                        'Initializing…'
                      ) : isCompleted ? (
                        'Review submission'
                      ) : (
                        rawStatus === 'not_started' ? 'Begin Session' : 'Resume Session'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-6 border-b border-zinc-100 pb-4">
            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Development Tools</h2>
            <div className="h-1 flex-1 bg-zinc-50 rounded-full ml-4 hidden sm:block" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate('/practice')}
              className="group rounded-2xl border border-zinc-100 bg-white p-6 text-left hover:border-zinc-900 transition-all shadow-sm flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-black text-zinc-900 tracking-tighter uppercase leading-none">Solution Set</h3>
                <p className="mt-2 text-xs text-zinc-400 font-bold uppercase tracking-wider">Independent Skill Refinement</p>
              </div>
              <span className="text-xl group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100">→</span>
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/submissions')}
              className="group rounded-2xl border border-zinc-100 bg-white p-6 text-left hover:border-zinc-900 transition-all shadow-sm flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-black text-zinc-900 tracking-tighter uppercase leading-none">History Logs</h3>
                <p className="mt-2 text-xs text-zinc-400 font-bold uppercase tracking-wider">Historical Performance Data</p>
              </div>
              <span className="text-xl group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100">→</span>
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
};
