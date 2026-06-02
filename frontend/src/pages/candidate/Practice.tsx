import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Question } from '../../types';
import { AppShell } from '../../components/AppShell';

export const Practice = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const fetchQuestions = async () => {
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

  if (loading) {
    return (
      <AppShell title="Problem Set" subtitle="Synchronizing challenge records…">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Loading library…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Problem set"
      subtitle="Develop your core technical skills with independent coding challenges. Zero performance pressure."
      wide
    >
      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 ml-1">Threshold Filter</p>
        <div className="flex flex-wrap gap-3">
          {['all', 'easy', 'medium', 'hard'].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFilter(level)}
              className={`rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === level
                  ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200'
                  : 'bg-white border border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => navigate(`/practice/${q.id}`)}
            className="w-full text-left rounded-2xl border border-zinc-200 bg-white p-8 hover:border-zinc-900 transition-all shadow-sm hover:shadow-xl group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-none group-hover:underline underline-offset-8">
                  {q.title}
                </h3>
                {q.description && (
                  <p className="mt-3 text-sm text-zinc-500 font-medium line-clamp-2 max-w-2xl">{q.description}</p>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <span
                    className={`rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
                      q.difficulty === 'easy'
                        ? 'bg-zinc-50 text-zinc-500 border-zinc-100'
                        : q.difficulty === 'medium'
                          ? 'bg-zinc-500 text-white border-zinc-500'
                          : 'bg-zinc-900 text-white border-zinc-900'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  {q.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-zinc-100 bg-zinc-50 px-2 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="shrink-0 rounded-xl bg-zinc-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white group-hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98]">
                Initialize Editor
              </span>
            </div>
          </button>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/30 py-24 text-center shadow-inner">
          <p className="text-zinc-300 text-[10px] font-black uppercase tracking-widest italic">No matching records synchronization</p>
        </div>
      )}
    </AppShell>
  );
};
