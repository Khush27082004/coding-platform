import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CodeEditor } from '../../components/CodeEditor';
import api from '../../services/api';

export const TakeTest = () => {
  const { id } = useParams();
  const [assessment, setAssessment] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    startAssessment();
  }, [id]);

  const startAssessment = async () => {
    try {
      const res = await api.post(`/assessments/${id}/start`);
      setAssessment(res.data.data);
      if (res.data.data.assessment.assessmentQuestions[0]) {
        const question = res.data.data.assessment.assessmentQuestions[0].question;
        const starterCode = getStarterCode(question, language);
        setCode(starterCode);
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to start assessment');
    }
  };

  const getStarterCode = (question: any, lang: string) => {
    const codeMap: any = {
      python: question.starterCodePython,
      javascript: question.starterCodeJavascript,
      java: question.starterCodeJava,
      cpp: question.starterCodeCpp,
    };
    return codeMap[lang] || '';
  };

  const runCode = async () => {
    setLoading(true);
    setOutput('Running...');
    try {
      const res = await api.post('/submissions/run', {
        language,
        code,
        input: '',
      });
      setOutput(res.data.data.output || res.data.data.error);
    } catch (error) {
      setOutput('Error running code');
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setSubmitting(true);
    setOutput('Submitting solution...');
    try {
      const question = assessment.assessment.assessmentQuestions[currentQuestion].question;
      const submitRes = await api.post('/submissions', {
        userAssessmentId: assessment.id,
        questionId: question.id,
        language,
        code,
      });

      const submissionId = submitRes.data.data.id;
      let attempts = 0;
      let isCompleted = false;

      while (attempts < 30 && !isCompleted) {
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const statusRes = await api.get(`/submissions/${submissionId}`);
        if (statusRes.data.data.status === 'completed') {
          isCompleted = true;
          const evaluated = statusRes.data.data;
          setOutput(`Submitted and evaluated. Passed ${evaluated.passedTests}/${evaluated.totalTests}, score ${evaluated.score}/${evaluated.maxScore}.`);
        }
      }

      if (!isCompleted) {
        setOutput('Submission accepted. Evaluation is taking longer than expected. Please check submissions.');
      }

      // Check if the full assessment is completed and show final message
      const assessmentsRes = await api.get('/assessments');
      const currentAssessment = (assessmentsRes.data.data || []).find((a: any) => a.id === id);
      const ua = currentAssessment?.userAssessments?.[0];
      if (ua?.status === 'completed') {
        setOutput(`✅ Test finished. Final Score: ${ua.score}/${ua.maxScore}`);
      } else {
        setOutput((prev) => `${prev}\n✅ Solution submitted and evaluated. Continue with remaining questions.`);
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to submit';
      setOutput(`❌ ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!assessment) return <div className="p-6">Loading assessment...</div>;

  const question = assessment.assessment.assessmentQuestions[currentQuestion]?.question;
  if (!question) return <div className="p-6">No questions available</div>;

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const starterCode = getStarterCode(question, newLang);
    setCode(starterCode);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex justify-between items-center shadow-lg border-b-2 border-blue-400">
        <div>
          <h1 className="text-2xl font-bold">{assessment.assessment.title}</h1>
          <p className="text-blue-100 text-sm">Question {currentQuestion + 1} of {assessment.assessment.assessmentQuestions.length}</p>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <div className="text-sm text-blue-100">Language</div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-blue-700 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600"
            >
              <option value="python">🐍 Python</option>
              <option value="javascript">📜 JavaScript</option>
              <option value="java">☕ Java</option>
              <option value="cpp">⚙️ C++</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Problem Panel */}
        <div className="w-1/3 bg-gray-800 text-white overflow-y-auto border-r border-gray-700">
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-3">{question.title}</h2>
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  question.difficulty === 'easy' ? 'bg-green-900 text-green-200' :
                  question.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                  'bg-red-900 text-red-200'
                }`}>
                  {question.difficulty.toUpperCase()}
                </span>
                <span className="text-gray-400 text-sm">⏱️ {question.timeLimit}ms</span>
                <span className="text-gray-400 text-sm">💾 {question.memoryLimit}MB</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-blue-300 mb-2">📝 Problem Description</h3>
                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{question.description}</p>
              </div>

              {question.constraints && (
                <div>
                  <h3 className="text-lg font-bold text-blue-300 mb-2">📋 Constraints</h3>
                  <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-x-auto">{question.constraints}</pre>
                </div>
              )}

              {question.sampleInput && (
                <div>
                  <h3 className="text-lg font-bold text-blue-300 mb-2">📥 Sample Input</h3>
                  <pre className="bg-gray-900 p-3 rounded text-sm text-green-300 font-mono overflow-x-auto">{question.sampleInput}</pre>
                </div>
              )}

              {question.sampleOutput && (
                <div>
                  <h3 className="text-lg font-bold text-blue-300 mb-2">📤 Sample Output</h3>
                  <pre className="bg-gray-900 p-3 rounded text-sm text-green-300 font-mono overflow-x-auto">{question.sampleOutput}</pre>
                </div>
              )}

              {question.explanation && (
                <div>
                  <h3 className="text-lg font-bold text-blue-300 mb-2">💡 Explanation</h3>
                  <p className="text-gray-300 text-sm">{question.explanation}</p>
                </div>
              )}

              {question.tags && question.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-blue-300 mb-2">🏷️ Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-xs font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="w-2/3 flex flex-col bg-gray-900">
          {/* Editor */}
          <div className="flex-1 border-b border-gray-700">
            <div className="h-full">
              <CodeEditor value={code} onChange={setCode} language={language} />
            </div>
          </div>

          {/* Output Panel */}
          <div className="h-1/3 bg-gray-800 border-t border-gray-700 flex flex-col">
            <div className="bg-gray-700 px-4 py-3 flex justify-between items-center border-b border-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">📊 Output</span>
                <span className="text-gray-400 text-sm">({output.split('\n').length} lines)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runCode}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded font-semibold transition flex items-center gap-2"
                >
                  {loading ? '⏳ Running...' : '▶️ Run Code'}
                </button>
                <button
                  onClick={submitCode}
                  disabled={loading || submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded font-semibold transition flex items-center gap-2"
                >
                  {submitting ? '⏳ Submitting...' : '✅ Submit'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-gray-300 bg-gray-900">
              {output ? (
                <pre className="whitespace-pre-wrap text-green-400">{output}</pre>
              ) : (
                <p className="text-gray-500">Output will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3 flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2 rounded font-semibold transition"
        >
          ← Previous
        </button>
        <span className="text-gray-300">
          Question {currentQuestion + 1} / {assessment.assessment.assessmentQuestions.length}
        </span>
        <button
          onClick={() => setCurrentQuestion(Math.min(assessment.assessment.assessmentQuestions.length - 1, currentQuestion + 1))}
          disabled={currentQuestion === assessment.assessment.assessmentQuestions.length - 1}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2 rounded font-semibold transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
