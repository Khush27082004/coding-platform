import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CodeEditor } from '../../components/CodeEditor';
import api from '../../services/api';

export const PracticeProblem = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const res = await api.get(`/questions/${id}`);
      setQuestion(res.data.data);
      setCustomInput(res.data.data.sampleInput || '');
      const starterCode = getStarterCode(res.data.data, language);
      setCode(starterCode);
    } catch (error) {
      console.error('Failed to fetch question', error);
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

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (question) {
      const starterCode = getStarterCode(question, newLang);
      setCode(starterCode);
    }
  };

  const runCode = async () => {
    setLoading(true);
    setOutput('Running...');
    try {
      const res = await api.post('/submissions/run', {
        language,
        code,
        input: customInput,
      });
      setOutput(res.data.data.output || res.data.data.error || 'No output');
    } catch (error) {
      setOutput('Error running code');
    } finally {
      setLoading(false);
    }
  };

  if (!question) return <div className="p-6">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 flex justify-between items-center shadow-lg border-b-2 border-purple-400">
        <div>
          <h1 className="text-2xl font-bold">🎯 Practice: {question.title}</h1>
          <p className="text-purple-100 text-sm">Solve at your own pace</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-purple-100 mb-2">Language</div>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-purple-700 text-white px-4 py-2 rounded font-semibold hover:bg-purple-600"
          >
            <option value="python">🐍 Python</option>
            <option value="javascript">📜 JavaScript</option>
            <option value="java">☕ Java</option>
            <option value="cpp">⚙️ C++</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Problem Panel */}
        <div className="w-1/3 bg-gray-800 text-white overflow-y-auto border-r border-gray-700">
          <div className="p-6">
            <div className="mb-4">
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
                <h3 className="text-lg font-bold text-purple-300 mb-2">📝 Problem</h3>
                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{question.description}</p>
              </div>

              {question.constraints && (
                <div>
                  <h3 className="text-lg font-bold text-purple-300 mb-2">📋 Constraints</h3>
                  <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-x-auto">{question.constraints}</pre>
                </div>
              )}

              {question.sampleInput && (
                <div>
                  <h3 className="text-lg font-bold text-purple-300 mb-2">📥 Sample Input</h3>
                  <pre className="bg-gray-900 p-3 rounded text-sm text-green-300 font-mono overflow-x-auto">{question.sampleInput}</pre>
                </div>
              )}

              {question.sampleOutput && (
                <div>
                  <h3 className="text-lg font-bold text-purple-300 mb-2">📤 Sample Output</h3>
                  <pre className="bg-gray-900 p-3 rounded text-sm text-green-300 font-mono overflow-x-auto">{question.sampleOutput}</pre>
                </div>
              )}

              {question.explanation && (
                <div>
                  <h3 className="text-lg font-bold text-purple-300 mb-2">💡 Explanation</h3>
                  <p className="text-gray-300 text-sm">{question.explanation}</p>
                </div>
              )}

              {question.tags && question.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-purple-300 mb-2">🏷️ Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-xs font-semibold">
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

          {/* Custom Input & Output */}
          <div className="h-1/3 bg-gray-800 border-t border-gray-700 flex flex-col">
            <div className="grid grid-cols-2 h-full">
              {/* Input */}
              <div className="border-r border-gray-700 flex flex-col">
                <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
                  <span className="text-white font-bold">📥 Custom Input</span>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-gray-900 text-gray-300 p-4 font-mono text-sm resize-none focus:outline-none"
                  placeholder="Enter test input here..."
                />
              </div>

              {/* Output */}
              <div className="flex flex-col">
                <div className="bg-gray-700 px-4 py-2 border-b border-gray-600 flex justify-between items-center">
                  <span className="text-white font-bold">📊 Output</span>
                  <div className="flex gap-2">
                    <button
                      onClick={runCode}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-1 rounded text-sm font-semibold transition"
                    >
                      {loading ? '⏳ Running...' : '▶️ Run'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-gray-300 bg-gray-900">
                  {output ? (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <p className="text-gray-500">Output will appear here...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
