import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.fullName}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user?.role === 'admin' ? (
          <>
            <div
              onClick={() => navigate('/admin/questions')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">📝</div>
              <h2 className="text-xl font-bold mb-2">Questions</h2>
              <p className="text-blue-100">Create and manage coding problems</p>
            </div>
            <div
              onClick={() => navigate('/admin/assessments')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">📋</div>
              <h2 className="text-xl font-bold mb-2">Assessments</h2>
              <p className="text-green-100">Create and manage tests</p>
            </div>
            <div
              onClick={() => navigate('/admin/analytics')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">📊</div>
              <h2 className="text-xl font-bold mb-2">Analytics</h2>
              <p className="text-purple-100">View performance metrics</p>
            </div>
          </>
        ) : (
          <>
            <div
              onClick={() => navigate('/assessments')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">📝</div>
              <h2 className="text-xl font-bold mb-2">My Assessments</h2>
              <p className="text-blue-100">View and take assigned tests</p>
            </div>
            <div
              onClick={() => navigate('/practice')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">💻</div>
              <h2 className="text-xl font-bold mb-2">Practice</h2>
              <p className="text-green-100">Solve coding problems</p>
            </div>
            <div
              onClick={() => navigate('/submissions')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">📊</div>
              <h2 className="text-xl font-bold mb-2">Submissions</h2>
              <p className="text-purple-100">View your submission history</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
