import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../../services/api';

export const CreateQuestion = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    timeLimit: 1000,
    memoryLimit: 256,
    sampleInput: '',
    sampleOutput: '',
    tags: '',
    starterCodePython: '',
    starterCodeJavascript: '',
    starterCodeJava: '',
    starterCodeCpp: '',
  });
  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '', isHidden: false, points: 10 }
  ]);

  useEffect(() => {
    if (id) {
      fetchQuestion();
    }
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const res = await api.get(`/questions/${id}`);
      const q = res.data.data;
      setIsEditing(true);
      setFormData({
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit,
        memoryLimit: q.memoryLimit,
        sampleInput: q.sampleInput || '',
        sampleOutput: q.sampleOutput || '',
        tags: q.tags.join(', '),
        starterCodePython: q.starterCodePython || '',
        starterCodeJavascript: q.starterCodeJavascript || '',
        starterCodeJava: q.starterCodeJava || '',
        starterCodeCpp: q.starterCodeCpp || '',
      });
      setTestCases(q.testCases || [{ input: '', expectedOutput: '', isHidden: false, points: 10 }]);
    } catch (error) {
      console.error('Failed to fetch question', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        timeLimit: formData.timeLimit,
        memoryLimit: formData.memoryLimit,
        constraints: formData.constraints,
        inputFormat: formData.inputFormat,
        outputFormat: formData.outputFormat,
        sampleInput: formData.sampleInput,
        sampleOutput: formData.sampleOutput,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        starterCodePython: formData.starterCodePython,
        starterCodeJavascript: formData.starterCodeJavascript,
        starterCodeJava: formData.starterCodeJava,
        starterCodeCpp: formData.starterCodeCpp,
        testCases: testCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          points: tc.points,
        })),
      };

      if (isEditing && id) {
        await api.put(`/questions/${id}`, submitData);
        alert('Question updated successfully!');
      } else {
        await api.post('/questions', submitData);
        alert('Question created successfully!');
      }
      navigate('/admin/questions');
    } catch (error: any) {
      console.error('Error:', error.response?.data);
      alert(error.response?.data?.error?.message || 'Failed to save question');
    }
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: false, points: 10 }]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit' : 'Create'} Question</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block font-bold mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-bold mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border rounded h-32"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-bold mb-2">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">Time Limit (ms)</label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Memory Limit (MB)</label>
            <input
              type="number"
              value={formData.memoryLimit}
              onChange={(e) => setFormData({...formData, memoryLimit: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold mb-2">Tags (comma separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            placeholder="arrays, sorting, hash-table"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-2">Sample Input</label>
            <textarea
              value={formData.sampleInput}
              onChange={(e) => setFormData({...formData, sampleInput: e.target.value})}
              className="w-full px-3 py-2 border rounded h-24"
            />
          </div>
          <div>
            <label className="block font-bold mb-2">Sample Output</label>
            <textarea
              value={formData.sampleOutput}
              onChange={(e) => setFormData({...formData, sampleOutput: e.target.value})}
              className="w-full px-3 py-2 border rounded h-24"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-bold mb-4">Starter Code Snippets</h3>
          <p className="text-gray-600 mb-4">Provide starter code for each language (students will see this)</p>
          
          <div className="space-y-4">
            <div>
              <label className="block font-bold mb-2">Python Starter Code</label>
              <textarea
                value={formData.starterCodePython}
                onChange={(e) => setFormData({...formData, starterCodePython: e.target.value})}
                className="w-full px-3 py-2 border rounded font-mono text-sm h-24"
                placeholder="def solution(arr):&#10;    # Write your code here&#10;    pass"
              />
            </div>

            <div>
              <label className="block font-bold mb-2">JavaScript Starter Code</label>
              <textarea
                value={formData.starterCodeJavascript}
                onChange={(e) => setFormData({...formData, starterCodeJavascript: e.target.value})}
                className="w-full px-3 py-2 border rounded font-mono text-sm h-24"
                placeholder="function solution(arr) {&#10;    // Write your code here&#10;}"
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Java Starter Code</label>
              <textarea
                value={formData.starterCodeJava}
                onChange={(e) => setFormData({...formData, starterCodeJava: e.target.value})}
                className="w-full px-3 py-2 border rounded font-mono text-sm h-24"
                placeholder="public class Solution {&#10;    public void solve(int[] arr) {&#10;        // Write your code here&#10;    }&#10;}"
              />
            </div>

            <div>
              <label className="block font-bold mb-2">C++ Starter Code</label>
              <textarea
                value={formData.starterCodeCpp}
                onChange={(e) => setFormData({...formData, starterCodeCpp: e.target.value})}
                className="w-full px-3 py-2 border rounded font-mono text-sm h-24"
                placeholder="void solution(vector<int>& arr) {&#10;    // Write your code here&#10;}"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block font-bold">Test Cases</label>
            <button
              type="button"
              onClick={addTestCase}
              className="text-blue-600 hover:underline"
            >
              + Add Test Case
            </button>
          </div>
          
          {testCases.map((tc, idx) => (
            <div key={idx} className="border p-4 rounded mb-2">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-sm mb-1">Input</label>
                  <textarea
                    value={tc.input}
                    onChange={(e) => {
                      const updated = [...testCases];
                      updated[idx].input = e.target.value;
                      setTestCases(updated);
                    }}
                    className="w-full px-2 py-1 border rounded text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Expected Output</label>
                  <textarea
                    value={tc.expectedOutput}
                    onChange={(e) => {
                      const updated = [...testCases];
                      updated[idx].expectedOutput = e.target.value;
                      setTestCases(updated);
                    }}
                    className="w-full px-2 py-1 border rounded text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={tc.isHidden}
                    onChange={(e) => {
                      const updated = [...testCases];
                      updated[idx].isHidden = e.target.checked;
                      setTestCases(updated);
                    }}
                    className="mr-2"
                  />
                  Hidden
                </label>
                <label className="flex items-center">
                  Points:
                  <input
                    type="number"
                    value={tc.points}
                    onChange={(e) => {
                      const updated = [...testCases];
                      updated[idx].points = parseInt(e.target.value);
                      setTestCases(updated);
                    }}
                    className="ml-2 w-20 px-2 py-1 border rounded"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {isEditing ? 'Update' : 'Create'} Question
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/questions')}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
