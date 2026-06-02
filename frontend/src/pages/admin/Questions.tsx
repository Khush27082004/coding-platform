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

  if (loading) {
    return (
      <AppShell title="Internal Assets" subtitle="Synchronizing question data…">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-12 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Loading library…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Question library"
      subtitle="The foundational challenges fueling your assessments and practice tiers."
      actions={
        <button
          type="button"
          onClick={() => navigate('/admin/questions/create')}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-black text-white hover:bg-zinc-800 transition-all uppercase tracking-widest shadow-xl shadow-zinc-200"
        >
          New challenge
        </button>
      }
    >
      <div className="mb-8">
        <div className="relative max-w-md group">
          <input
            type="text"
            placeholder="FILTER BY ATTRIBUTES..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 pl-11 text-xs font-bold text-zinc-900 placeholder-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-sm group-hover:shadow-md"
          />
          <svg className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
      </div>

      <div className="space-y-4">
        {filteredQuestions.map((q) => (
          <div
            key={q.id}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 hover:border-zinc-900 transition-all shadow-sm hover:shadow-lg"
          >
            <div className="min-w-0">
              <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{q.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${q.difficulty === 'easy'
                      ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
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
            <div className="flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[10px] font-black text-zinc-500 hover:text-zinc-900 hover:border-zinc-900 transition-all uppercase tracking-widest"
              >
                Modify
              </button>
              <button
                type="button"
                onClick={() => deleteQuestion(q.id)}
                className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2 text-[10px] font-black text-zinc-300 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all uppercase tracking-widest"
              >
                Archived
              </button>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/30 py-20 text-center shadow-inner">
          <p className="text-zinc-300 text-xs font-black uppercase tracking-[0.2em]">Zero records found</p>
          <button
            type="button"
            onClick={() => navigate('/admin/questions/create')}
            className="mt-6 text-[11px] font-black text-zinc-900 hover:underline underline-offset-8 transition-all uppercase tracking-[0.1em]"
          >
            Initialize library protocol →
          </button>
        </div>
      )}
    </AppShell>
  );
};
