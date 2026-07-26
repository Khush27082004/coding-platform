import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Question } from '../../types';
import { AppShell } from '../../components/AppShell';
import { Plus, Search, Pencil, Trash2, BookOpen } from 'lucide-react';

export const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const filteredQuestions = questions.filter(q =>
    q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  const difficultyConfig = {
    easy:   { cls: 'badge-easy',   label: 'Easy' },
    medium: { cls: 'badge-medium', label: 'Medium' },
    hard:   { cls: 'badge-hard',   label: 'Hard' },
  } as const;

  if (loading) {
    return (
      <AppShell title="Question Library" subtitle="Synchronizing question data…">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-slate-800 p-5 space-y-3">
              <div className="skeleton h-4 w-56 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Question Library"
      subtitle="The foundational challenges fueling your assessments and practice tiers."
      actions={
        <button
          type="button"
          onClick={() => navigate('/admin/questions/create')}
          className="btn-primary"
        >
          <Plus size={16} />
          New Question
        </button>
      }
    >
      <div className="space-y-5 animate-fade-in">
        {/* Search */}
        {questions.length > 0 && (
          <div className="relative max-w-sm group">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title or tag…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark pl-10 text-sm"
            />
          </div>
        )}

        {/* List */}
        {filteredQuestions.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <BookOpen size={22} className="text-slate-600" />
            </div>
            {questions.length === 0 ? (
              <>
                <p className="text-slate-400 font-semibold text-sm">No questions yet</p>
                <p className="text-slate-600 text-xs mt-1">Create your first challenge to get started</p>
                <button
                  type="button"
                  onClick={() => navigate('/admin/questions/create')}
                  className="btn-primary mt-4 text-xs"
                >
                  <Plus size={14} /> Create Question
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-400 font-semibold text-sm">No results found</p>
                <p className="text-slate-600 text-xs mt-1">Try a different search term</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredQuestions.map((q) => {
              const diff = difficultyConfig[q.difficulty as keyof typeof difficultyConfig] ?? { cls: 'badge-easy', label: q.difficulty };
              return (
                <div
                  key={q.id}
                  className="group card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-indigo-500/30"
                >
                  {/* Left — title + badges */}
                  <div className="min-w-0 flex items-start gap-4">
                    {/* Difficulty color bar */}
                    <div className={`shrink-0 w-1 self-stretch rounded-full mt-0.5 ${
                      q.difficulty === 'easy' ? 'bg-emerald-500' :
                      q.difficulty === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{q.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`badge ${diff.cls}`}>{diff.label}</span>
                        {q.tags.map((tag) => (
                          <span
                            key={tag}
                            className="badge bg-slate-700/50 text-slate-400 border-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                      className="btn-ghost text-xs gap-1.5"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};
