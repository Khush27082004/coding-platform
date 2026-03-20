import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Question } from '../../types';

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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Practice Problems</h1>

      <div className="mb-6 flex gap-2">
        {['all', 'easy', 'medium', 'hard'].map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded ${
              filter === level
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {questions.map((q) => (
          <div
            key={q.id}
            onClick={() => navigate(`/practice/${q.id}`)}
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
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
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Solve
              </button>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No questions available for practice.
        </div>
      )}
    </div>
  );
};
