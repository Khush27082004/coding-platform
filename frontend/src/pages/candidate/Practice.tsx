import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Question } from '../../types';
import { AppShell } from '../../components/AppShell';
import { Code2, ArrowRight } from 'lucide-react';

const FILTERS = ['all', 'easy', 'medium', 'hard'] as const;
type Filter = typeof FILTERS[number];

const filterConfig = {
  all:    { label: 'All',    cls: 'bg-indigo-600 text-white border-indigo-600' },
  easy:   { label: 'Easy',   cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  medium: { label: 'Medium', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  hard:   { label: 'Hard',   cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

const inactiveBase = 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600';

export const Practice = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?difficulty=${filter}` : '';
      const res = await api.get(`/questions${params}`);
      setQuestions(res.data.data);
    } catch (error) {
      console.error('Failed to fetch questions', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Problem Set"
      subtitle="Develop your core technical skills with independent coding challenges. Zero performance pressure."
      wide
    >
      <div className="space-y-6 animate-fade-in">
        {/* Difficulty filters */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Difficulty Filter</p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilter(level)}
                className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  filter === level ? filterConfig[level].cls : inactiveBase
                }`}
              >
                {filterConfig[level].label}
              </button>
            ))}
          </div>
        </div>

        {/* Question list */}
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl border border-slate-800 p-5 space-y-3">
                <div className="skeleton h-4 w-56 rounded" />
                <div className="skeleton h-3 w-80 rounded" />
                <div className="flex gap-2 mt-2">
                  <div className="skeleton h-5 w-12 rounded-full" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <Code2 size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">No questions found</p>
            <p className="text-slate-600 text-xs mt-1">
              {filter === 'all' ? 'No problems in the library yet.' : `No ${filter} difficulty problems.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {questions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => navigate(`/practice/${q.id}`)}
                className="group w-full text-left card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-indigo-500/30 transition-all"
              >
                {/* Left */}
                <div className="flex items-start gap-4 min-w-0">
                  {/* Difficulty bar */}
                  <div className={`shrink-0 w-1 self-stretch rounded-full ${
                    q.difficulty === 'easy' ? 'bg-emerald-500' :
                    q.difficulty === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {q.title}
                    </h3>
                    {q.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1 max-w-xl">{q.description}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className={`badge ${
                        q.difficulty === 'easy' ? 'badge-easy' :
                        q.difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
                      }`}>{q.difficulty}</span>
                      {q.tags.map((tag) => (
                        <span key={tag} className="badge bg-slate-700/50 text-slate-400 border-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right CTA */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 group-hover:bg-indigo-600 text-xs font-bold text-slate-300 group-hover:text-white border border-slate-700 group-hover:border-indigo-600 transition-all">
                    Solve
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
