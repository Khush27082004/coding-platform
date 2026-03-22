import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Question } from '../../types';
import { AppShell } from '../../components/AppShell';

export const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions');
      setQuestions(res.data.data);
    } catch (error) {
      console.error('Failed to fetch questions', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      fetchQuestions();
    } catch {
      alert('Failed to delete question');
    }
  };

  if (loading) {
    return (
      <AppShell title="Question bank" subtitle="Loading…">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500 text-sm">
          Loading questions…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Question bank"
      subtitle="Problems used in practice and in assessments."
      actions={
        <button
          type="button"
          onClick={() => navigate('/admin/questions/create')}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          New question
        </button>
      }
    >
      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
          >
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white">{q.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                    q.difficulty === 'easy'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : q.difficulty === 'medium'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {q.difficulty}
                </span>
                {q.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteQuestion(q.id)}
                className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-sm font-medium text-rose-300 hover:bg-rose-950/50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-16 text-center">
          <p className="text-slate-400 text-sm">No questions yet.</p>
          <button
            type="button"
            onClick={() => navigate('/admin/questions/create')}
            className="mt-4 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Create your first question →
          </button>
        </div>
      )}
    </AppShell>
  );
};
