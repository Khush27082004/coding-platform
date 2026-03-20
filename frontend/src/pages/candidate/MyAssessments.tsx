import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const MyAssessments = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await api.get('/assessments');
      setAssessments(res.data.data);
    } catch (error) {
      console.error('Failed to fetch assessments', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Assessments</h1>

      <div className="grid gap-4">
        {assessments.map((a) => (
          <div key={a.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold">{a.title}</h3>
            <p className="text-gray-600 mt-2">{a.description}</p>
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>⏱️ {a.duration} minutes</span>
              <span>📊 {a.totalScore} points</span>
            </div>
            <button
              onClick={() => navigate(`/assessment/${a.id}/start`)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Start Assessment
            </button>
          </div>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No assessments assigned yet.
        </div>
      )}
    </div>
  );
};
