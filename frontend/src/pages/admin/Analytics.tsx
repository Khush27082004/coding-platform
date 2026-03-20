import { useState, useEffect } from 'react';
import api from '../../services/api';

export const Analytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalAssessments: 0,
    totalSubmissions: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real app, you'd have an analytics endpoint
      const [questions, assessments] = await Promise.all([
        api.get('/questions'),
        api.get('/assessments'),
      ]);
      
      setStats({
        totalUsers: 0, // Would come from backend
        totalQuestions: questions.data.pagination?.total || questions.data.data.length,
        totalAssessments: assessments.data.data.length,
        totalSubmissions: 0, // Would come from backend
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Total Questions</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalQuestions}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Total Assessments</div>
          <div className="text-3xl font-bold text-green-600">{stats.totalAssessments}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Total Submissions</div>
          <div className="text-3xl font-bold text-purple-600">{stats.totalSubmissions}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Active Users</div>
          <div className="text-3xl font-bold text-orange-600">{stats.totalUsers}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="text-gray-500">No recent activity</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Popular Questions</h2>
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    </div>
  );
};
