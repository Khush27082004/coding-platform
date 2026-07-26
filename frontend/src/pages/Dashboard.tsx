import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { AppShell } from '../components/AppShell';
import { BookOpen, ClipboardList, Code2, History, Clock, Star, ChevronRight, PlayCircle } from 'lucide-react';

type AssignedAssessment = {
  id: string;
  title: string;
  description?: string;
  duration: number;
  totalScore?: number;
  userAssessments?: { status: string; score?: number }[];
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
    return () => { cancelled = true; };
  }, [user?.role]);

  /* ── Admin Dashboard ── */
  if (user?.role === 'admin') {
    return (
      <AppShell
        title="Command center"
        subtitle="Orchestrate your questions, assessments, and candidate analytics."
      >
        <div className="space-y-8 animate-fade-in">
          {/* Greeting */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600/15 to-purple-600/10 border border-indigo-500/15 p-6">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">{getGreeting()}</p>
            <h2 className="text-2xl font-bold text-white">{user.fullName} 👋</h2>
            <p className="text-sm text-slate-400 mt-1">Here's your admin dashboard overview.</p>
          </div>

          {/* Quick action cards */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <BookOpen size={22} className="text-indigo-400" />,
                  label: 'Question Bank',
                  title: 'Questions',
                  desc: 'Curate and manage your collection of coding challenges.',
                  to: '/admin/questions',
                  color: 'indigo',
                },
                {
                  icon: <ClipboardList size={22} className="text-purple-400" />,
                  label: 'Test Logistics',
                  title: 'Assessments',
                  desc: 'Schedule evaluations and monitor candidate performance.',
                  to: '/admin/assessments',
                  color: 'purple',
                },
              ].map((card) => (
                <button
                  key={card.to}
                  type="button"
                  onClick={() => navigate(card.to)}
                  className="group text-left card card-interactive p-6 flex items-start gap-5"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-${card.color}-500/10 border border-${card.color}-500/15 group-hover:bg-${card.color}-500/15 transition-colors`}>
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      {card.label}
                    </p>
                    <h3 className="text-base font-bold text-white">{card.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Candidate Dashboard ── */
  return (
    <AppShell
      title={`${getGreeting()}, ${user?.fullName?.split(' ')[0] || 'Member'}`}
      subtitle="Access your active assessments and skill development tools."
    >
      <div className="space-y-8 animate-fade-in">
        {/* Assigned Assessments */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Assigned Evaluations
            </h2>
            <div className="h-px flex-1 bg-slate-800 ml-4" />
          </div>

          {loadingTests ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-800 p-6 space-y-3">
                  <div className="skeleton h-4 w-48 rounded" />
                  <div className="skeleton h-3 w-72 rounded" />
                  <div className="skeleton h-10 w-full rounded-xl mt-4" />
                </div>
              ))}
            </div>
          ) : assigned.length === 0 ? (
            <div className="empty-state">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <ClipboardList size={22} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-semibold text-sm">No assigned assessments</p>
              <p className="text-slate-600 text-xs mt-1">Awaiting administrator assignment</p>
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
                    className="card p-6 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-bold text-white leading-tight">{a.title}</h3>
                      <span className={`shrink-0 badge ${isCompleted ? 'bg-slate-700/60 text-slate-400 border-slate-700' : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25'}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {a.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{a.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 mb-5">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-600" /> {a.duration} min
                      </span>
                      {a.totalScore != null && (
                        <span className="flex items-center gap-1.5">
                          <Star size={12} className="text-slate-600" /> {a.totalScore} pts
                        </span>
                      )}
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
                      className={`mt-auto w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isCompleted
                          ? 'bg-slate-800 text-slate-500 cursor-default'
                          : startingId === a.id
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'btn-primary'
                      }`}
                    >
                      {startingId === a.id ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Initializing…</>
                      ) : isCompleted ? (
                        'Review Submission'
                      ) : (
                        <><PlayCircle size={14} /> {rawStatus === 'not_started' ? 'Begin Session' : 'Resume Session'}</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Development Tools */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Development Tools
            </h2>
            <div className="h-px flex-1 bg-slate-800 ml-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Code2 size={20} className="text-indigo-400" />,
                title: 'Practice Problems',
                desc: 'Independent skill refinement',
                to: '/practice',
              },
              {
                icon: <History size={20} className="text-purple-400" />,
                title: 'Submission History',
                desc: 'Historical performance data',
                to: '/submissions',
              },
            ].map((tool) => (
              <button
                key={tool.to}
                type="button"
                onClick={() => navigate(tool.to)}
                className="group card card-interactive p-5 text-left flex items-center gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 group-hover:bg-slate-700 transition-colors">
                  {tool.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{tool.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{tool.desc}</p>
                </div>
                <ChevronRight size={15} className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
};
