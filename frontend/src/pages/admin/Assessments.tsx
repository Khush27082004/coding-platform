import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Assessment } from '../../types';

export const Assessments = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assessments</h1>
        <button
          onClick={() => window.location.href = '/admin/assessments/create'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Assessment
        </button>
      </div>

      <div className="grid gap-4">
        {assessments.map((a) => (
          <div key={a.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-bold">{a.title}</h3>
            <p className="text-gray-600 mt-2">{a.description}</p>
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>Duration: {a.duration} mins</span>
              <span>Total Score: {a.totalScore}</span>
              <span>Passing: {a.passingScore}</span>
            </div>
          </div>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No assessments yet. Create your first assessment!
        </div>
      )}
    </div>
  );
};
