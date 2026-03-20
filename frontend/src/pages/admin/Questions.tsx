import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Question } from '../../types';

export const Questions = () => {
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
    } catch (error) {
      alert('Failed to delete question');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Questions</h1>
        <button
          onClick={() => window.location.href = '/admin/questions/create'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Question
        </button>
      </div>

      <div className="grid gap-4">
        {questions.map((q) => (
          <div key={q.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{q.title}</h3>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {q.difficulty}
                  </span>
                  {q.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = `/admin/questions/${q.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No questions yet. Create your first question!
        </div>
      )}
    </div>
  );
};
