import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CodeEditor } from '../../components/CodeEditor';
import api from '../../services/api';

type EvalStage = 'submitting' | 'evaluating' | 'done' | 'error';

interface EvalState {
  stage: EvalStage;
  message: string;
  passedTests: number;
  totalTests: number;
  score: number;
  maxScore: number;
  results: any[];
}

export const PracticeProblem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<any>(null);
  const [nextQuestionId, setNextQuestionId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testCaseResults, setTestCaseResults] = useState<any[]>([]);
  const [passedTests, setPassedTests] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(38);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'results'>('description');
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(`practice_timer_${id}`);
    return saved !== null ? parseInt(saved, 10) : 1800; // 30 minutes countdown start
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Evaluation overlay
  const [evalOverlay, setEvalOverlay] = useState<EvalState | null>(null);

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth >= 20 && newWidth <= 60) {
        setLeftPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev > 0 ? prev - 1 : 0;
        localStorage.setItem(`practice_timer_${id}`, newTime.toString());
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const res = await api.get(`/questions/${id}`);
      setQuestion(res.data.data);
      setCustomInput(res.data.data.sampleInput || '');
      const starterCode = getStarterCode(res.data.data, language);
      setCode(starterCode);

      // Find next question
      const allRes = await api.get('/questions');
      const questions = allRes.data.data;
      const currentIndex = questions.findIndex((q: any) => q.id === id);
      if (currentIndex !== -1 && currentIndex + 1 < questions.length) {
        setNextQuestionId(questions[currentIndex + 1].id);
      } else {
        setNextQuestionId(null);
      }
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
      c: question.starterCodeC,
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
    setActiveTab('results');
    try {
      const res = await api.post('/submissions/run', { language, code, input: customInput });
      setOutput(res.data.data.output || res.data.data.error || 'No output');
    } catch (error) {
      setOutput('Error running code');
    } finally {
      setLoading(false);
    }
  };

  const runAllTestCases = async () => {
    setLoading(true);
    setOutput('Running all test cases...');
    setActiveTab('results');
    try {
      const res = await api.post('/submissions/run-all', { questionId: id, language, code });
      const submission = res.data.data;
      setPassedTests(submission.passedTests || 0);
      setTotalTests(submission.totalTests || question?.testCases?.length || 0);
      setScore(submission.score || 0);
      setMaxScore(submission.maxScore || question?.testCases?.reduce((sum: number, tc: any) => sum + (tc.points ?? 1), 0) || 0);
      setTestCaseResults(submission.submissionResults || []);
      setOutput(`${submission.passedTests}/${submission.totalTests} test cases passed`);
    } catch (err) {
      setOutput('Failed to run test cases. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const submitSolution = async () => {
    const userAssessmentId = new URLSearchParams(window.location.search).get('userAssessmentId');

    // No assessment context → persist as a practice submission
    if (!userAssessmentId) {
      setEvalOverlay({ stage: 'evaluating', message: 'Running all test cases...', passedTests: 0, totalTests: 0, score: 0, maxScore: 0, results: [] });
      setSubmitting(true);
      try {
        const res = await api.post('/submissions/practice', { questionId: id, language, code });
        const sub = res.data.data;
        const results = sub.submissionResults || [];
        const passed = sub.passedTests || 0;
        const total = sub.totalTests || question?.testCases?.length || 0;
        const sc = sub.score || 0;
        const mx = sub.maxScore || question?.testCases?.reduce((s: number, tc: any) => s + (tc.points ?? 1), 0) || 0;
        setPassedTests(passed); setTotalTests(total); setScore(sc); setMaxScore(mx);
        setTestCaseResults(results);
        setOutput(`${passed}/${total} test cases passed`);
        setEvalOverlay({ stage: 'done', message: `${passed}/${total} test cases passed`, passedTests: passed, totalTests: total, score: sc, maxScore: mx, results });
      } catch {
        setEvalOverlay({ stage: 'error', message: 'Failed to run tests. Please retry.', passedTests: 0, totalTests: 0, score: 0, maxScore: 0, results: [] });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Assessment submission flow with polling
    setSubmitting(true);
    setEvalOverlay({ stage: 'submitting', message: 'Submitting your solution...', passedTests: 0, totalTests: 0, score: 0, maxScore: 0, results: [] });

    try {
      const sub = await api.post('/submissions', { userAssessmentId, questionId: id, language, code });
      const submissionId = sub.data.data.id;

      setEvalOverlay(prev => prev ? { ...prev, stage: 'evaluating', message: 'Evaluating against test cases...' } : prev);

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts += 1;
        try {
          const statusRes = await api.get(`/submissions/${submissionId}`);
          const evaluated = statusRes.data.data;
          if (evaluated.status === 'completed') {
            clearInterval(interval);
            const passed = evaluated.passedTests || 0;
            const total = evaluated.totalTests || question.testCases?.length || 0;
            const sc = evaluated.score || 0;
            const mx = question.testCases?.reduce((s: number, tc: any) => s + (tc.points ?? 1), 0) || 0;
            const results = evaluated.submissionResults?.map((r: any) => ({
              id: r.testCaseId,
              input: r.testCase?.input || '',
              expectedOutput: r.testCase?.expectedOutput || '',
              actualOutput: r.actualOutput || '',
              status: r.status,
              pointsEarned: r.pointsEarned || 0,
              pointsAvailable: r.testCase?.points || 0,
              errorMessage: r.errorMessage,
            })) || [];
            setPassedTests(passed); setTotalTests(total); setScore(sc); setMaxScore(mx);
            setTestCaseResults(results);
            setOutput(`Submission complete: ${passed}/${total} passed, score ${sc}`);
            setEvalOverlay({ stage: 'done', message: `Evaluation complete`, passedTests: passed, totalTests: total, score: sc, maxScore: mx, results });
            setSubmitting(false);
          } else if (attempts >= 30) {
            clearInterval(interval);
            setEvalOverlay(prev => prev ? { ...prev, stage: 'error', message: 'Evaluation timed out. Check submission history.' } : prev);
            setSubmitting(false);
          }
        } catch {
          if (attempts >= 30) {
            clearInterval(interval);
            setEvalOverlay(prev => prev ? { ...prev, stage: 'error', message: 'Server error. Check submission history.' } : prev);
            setSubmitting(false);
          }
        }
      }, 1000);
    } catch {
      setEvalOverlay(prev => prev ? { ...prev, stage: 'error', message: 'Submission failed. Please try again.' } : prev);
      setSubmitting(false);
    }
  };

  const closeEvalOverlay = () => {
    setEvalOverlay(null);
    setActiveTab('results');
  };

  const difficultyConfig: Record<string, { label: string; cls: string }> = {
    easy: { label: 'Easy', cls: 'text-green-500 bg-green-500/10 border-green-500/20' },
    medium: { label: 'Medium', cls: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
    hard: { label: 'Hard', cls: 'text-red-500 bg-red-500/10 border-red-500/20' },
  };

  const langIcons: Record<string, string> = {
    python: '🐍',
    javascript: '⚡',
    java: '☕',
    cpp: '⚙️',
    c: 'Ⓒ',
  };

  if (!question) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-black/10"></div>
          <div className="absolute inset-0 rounded-full border-2 border-t-black animate-spin"></div>
        </div>
        <p className="text-sm text-zinc-500 font-medium tracking-wide">Loading problem...</p>
      </div>
    </div>
  );

  const diff = difficultyConfig[question.difficulty] || difficultyConfig.easy;

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Evaluation Overlay Modal ── */}
      {evalOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-zinc-200">

            {/* Header */}
            <div className={`px-6 py-5 border-b border-zinc-100 flex items-center gap-3 ${evalOverlay.stage === 'done' && evalOverlay.passedTests === evalOverlay.totalTests && evalOverlay.totalTests > 0
                ? 'bg-green-50'
                : evalOverlay.stage === 'done'
                  ? 'bg-amber-50'
                  : evalOverlay.stage === 'error'
                    ? 'bg-red-50'
                    : 'bg-zinc-50'
              }`}>
              {/* Stage icon */}
              {(evalOverlay.stage === 'submitting' || evalOverlay.stage === 'evaluating') ? (
                <div className="w-9 h-9 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin flex-shrink-0" />
              ) : evalOverlay.stage === 'done' && evalOverlay.passedTests === evalOverlay.totalTests && evalOverlay.totalTests > 0 ? (
                <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              ) : evalOverlay.stage === 'done' ? (
                <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-zinc-900">
                  {evalOverlay.stage === 'submitting' ? 'Submitting…'
                    : evalOverlay.stage === 'evaluating' ? 'Evaluating…'
                      : evalOverlay.stage === 'error' ? 'Error'
                        : evalOverlay.passedTests === evalOverlay.totalTests && evalOverlay.totalTests > 0 ? 'Accepted!'
                          : 'Evaluation Complete'}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{evalOverlay.message}</div>
              </div>
            </div>

            {/* Stage steps */}
            <div className="px-6 py-4 flex items-center gap-2">
              {(['submitting', 'evaluating', 'done'] as EvalStage[]).map((s, i) => {
                const stages: EvalStage[] = ['submitting', 'evaluating', 'done', 'error'];
                const currentIdx = evalOverlay.stage === 'error' ? 2 : stages.indexOf(evalOverlay.stage);
                const stepIdx = i;
                const isDone = currentIdx > stepIdx || (evalOverlay.stage === 'done' && stepIdx === 2) || (evalOverlay.stage === 'error' && stepIdx <= 1);
                const isCurrent = currentIdx === stepIdx && evalOverlay.stage !== 'done' && evalOverlay.stage !== 'error';
                return (
                  <>
                    <div key={s} className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDone ? 'bg-zinc-900 text-white' : isCurrent ? 'bg-zinc-200 text-zinc-600 animate-pulse' : 'bg-zinc-100 text-zinc-400'
                        }`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs font-medium ${isCurrent ? 'text-zinc-900' : isDone ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        {s === 'submitting' ? 'Submit' : s === 'evaluating' ? 'Evaluate' : 'Result'}
                      </span>
                    </div>
                    {i < 2 && <div className={`flex-1 h-px ${currentIdx > i ? 'bg-zinc-900' : 'bg-zinc-200'}`} />}
                  </>
                );
              })}
            </div>

            {/* Score summary (when done) */}
            {evalOverlay.stage === 'done' && evalOverlay.totalTests > 0 && (
              <div className="px-6 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-center">
                    <div className={`text-2xl font-bold tabular-nums ${evalOverlay.passedTests === evalOverlay.totalTests ? 'text-green-600' : 'text-red-600'}`}>
                      {evalOverlay.passedTests}/{evalOverlay.totalTests}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Tests Passed</div>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold tabular-nums text-zinc-900">{evalOverlay.score}/{evalOverlay.maxScore}</div>
                    <div className="text-xs text-zinc-500 mt-1">Score</div>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-center">
                    <div className={`text-lg font-bold ${evalOverlay.passedTests === evalOverlay.totalTests && evalOverlay.totalTests > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {evalOverlay.totalTests > 0 ? Math.round((evalOverlay.passedTests / evalOverlay.totalTests) * 100) : 0}%
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Accuracy</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${evalOverlay.passedTests === evalOverlay.totalTests ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${evalOverlay.totalTests > 0 ? (evalOverlay.passedTests / evalOverlay.totalTests) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Per-test-case mini list (done + has results) */}
            {evalOverlay.stage === 'done' && evalOverlay.results.length > 0 && (
              <div className="px-6 pb-4 max-h-48 overflow-y-auto space-y-1.5">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Test Cases</div>
                {evalOverlay.results.map((tc: any, idx: number) => (
                  <div key={tc.id || idx} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${tc.status === 'passed' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                    }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${tc.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {tc.status === 'passed'
                          ? <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          : <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        }
                      </div>
                      <span className="font-medium text-zinc-700">Case #{idx + 1}</span>
                      {tc.errorMessage && <span className="text-amber-600 truncate max-w-28">{tc.errorMessage}</span>}
                    </div>
                    <span className={`font-bold ${tc.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                      {tc.pointsEarned}/{tc.pointsAvailable} pts
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Waiting state */}
            {(evalOverlay.stage === 'submitting' || evalOverlay.stage === 'evaluating') && (
              <div className="px-6 pb-5 text-center">
                <p className="text-xs text-zinc-400">Please wait, do not close this window…</p>
              </div>
            )}

            {/* Footer buttons */}
            {(evalOverlay.stage === 'done' || evalOverlay.stage === 'error') && (
              <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-3">
                <button
                  onClick={closeEvalOverlay}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm"
                >
                  View Details
                </button>
                <button
                  onClick={() => {
                    closeEvalOverlay();
                    if (nextQuestionId) {
                      navigate(`/practice/${nextQuestionId}`);
                    } else {
                      navigate('/');
                    }
                  }}
                  className="bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {nextQuestionId ? (
                    <>Next Problem <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg></>
                  ) : (
                    <>Return Home <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg></>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top Navigation Bar ── */}
      <header className="h-14 bg-white border-b border-zinc-200 flex items-center px-4 gap-4 flex-shrink-0 z-10">
        {/* Logo / Back */}
        <a
          href="/practice"
          className="flex items-center gap-2 text-zinc-900 hover:text-zinc-600 transition-colors mr-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm font-semibold">Problems</span>
        </a>

        <div className="h-5 w-px bg-zinc-200" />

        {/* Problem title */}
        <h1 className="text-sm font-semibold text-zinc-900 flex-1 truncate">{question.title}</h1>

        {/* Difficulty badge */}
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${diff.cls}`}>
          {diff.label}
        </span>

        <div className="h-5 w-px bg-zinc-200" />

        {/* Live Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-md font-mono text-xs font-semibold transition-colors ${timeLeft <= 300 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
          }`}>
          <svg className={`w-3.5 h-3.5 ${timeLeft <= 300 ? 'text-red-500' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
          {String(timeLeft % 60).padStart(2, '0')}
        </div>

        <div className="h-5 w-px bg-zinc-200" />

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 font-medium">Language</label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-zinc-900 text-white text-xs font-semibold pl-3 pr-8 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              {Object.entries(langIcons).map(([lang, icon]) => (
                <option key={lang} value={lang}>{icon} {lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
              ))}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={runCode}
            disabled={loading}
            className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm"
          >
            {loading ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            )}
            Run
          </button>
          <button
            onClick={runAllTestCases}
            disabled={loading}
            className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            Run Test Cases
          </button>
          <button
            onClick={submitSolution}
            disabled={submitting || loading}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm"
          >
            {submitting ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            )}
            Submit
          </button>
        </div>
      </header>

      {/* ── Main Split Layout ── */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>

        {/* ── LEFT: Problem Panel ── */}
        <div
          style={{ width: `${leftPanelWidth}%` }}
          className="flex flex-col bg-white border-r border-zinc-200 overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex border-b border-zinc-200 flex-shrink-0">
            {(['description', 'results'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-3 text-xs font-semibold transition-colors capitalize ${activeTab === tab
                    ? 'text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-700'
                  }`}
              >
                {tab === 'results' ? 'Test Results' : 'Description'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
                )}
                {tab === 'results' && testCaseResults.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-900 text-white text-[9px] font-bold">
                    {testCaseResults.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'description' ? (
              <div className="p-6 space-y-7">

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${diff.cls}`}>
                    {diff.label}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {question.timeLimit}ms
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                    {question.memoryLimit}MB
                  </span>
                </div>

                {/* Description */}
                <section>
                  <p className="text-zinc-800 text-sm leading-7 whitespace-pre-wrap">{question.description}</p>
                </section>

                {/* Sample Input */}
                {question.sampleInput && (
                  <section>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-3">Example Input</h3>
                    <div className="bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                        <span className="text-xs text-zinc-500 font-mono">stdin</span>
                        <button
                          onClick={() => navigator.clipboard?.writeText(question.sampleInput)}
                          className="text-zinc-600 hover:text-zinc-300 transition-colors"
                          title="Copy"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        </button>
                      </div>
                      <pre className="px-4 py-3 text-xs text-green-400 font-mono overflow-x-auto leading-relaxed">{question.sampleInput}</pre>
                    </div>
                  </section>
                )}

                {/* Sample Output */}
                {question.sampleOutput && (
                  <section>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-3">Example Output</h3>
                    <div className="bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                        <span className="text-xs text-zinc-500 font-mono">stdout</span>
                        <button
                          onClick={() => navigator.clipboard?.writeText(question.sampleOutput)}
                          className="text-zinc-600 hover:text-zinc-300 transition-colors"
                          title="Copy"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        </button>
                      </div>
                      <pre className="px-4 py-3 text-xs text-blue-400 font-mono overflow-x-auto leading-relaxed">{question.sampleOutput}</pre>
                    </div>
                  </section>
                )}

                {/* Constraints */}
                {question.constraints && (
                  <section>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-3">Constraints</h3>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                      <pre className="text-xs text-zinc-700 font-mono whitespace-pre-wrap leading-relaxed">{question.constraints}</pre>
                    </div>
                  </section>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <section>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-3">Explanation</h3>
                    <p className="text-zinc-700 text-sm leading-7">{question.explanation}</p>
                  </section>
                )}

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-3">Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {question.tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-full text-xs font-medium hover:bg-zinc-200 transition-colors cursor-default">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              /* Results Tab */
              <div className="p-5 space-y-4">
                {/* Summary bar */}
                {(totalTests > 0 || output) && (
                  <div className={`flex items-center gap-3 p-4 rounded-lg border ${passedTests === totalTests && totalTests > 0
                      ? 'bg-green-500/5 border-green-500/20'
                      : totalTests > 0
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-zinc-100 border-zinc-200'
                    }`}>
                    {totalTests > 0 ? (
                      <>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${passedTests === totalTests ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                          {passedTests === totalTests ? (
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          )}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${passedTests === totalTests ? 'text-green-600' : 'text-red-600'}`}>
                            {passedTests === totalTests ? 'All Tests Passed' : `${passedTests} / ${totalTests} Passed`}
                          </div>
                          <div className="text-xs text-zinc-500">Score: {score} / {maxScore}</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-zinc-700 font-medium">{output}</div>
                    )}
                  </div>
                )}

                {/* Output / Custom run */}
                {output && testCaseResults.length === 0 && (
                  <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
                    <div className="px-4 py-2 border-b border-zinc-800 text-xs text-zinc-500 font-mono">output</div>
                    <pre className="px-4 py-3 text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">{output}</pre>
                  </div>
                )}

                {/* Test case results */}
                {testCaseResults.length > 0 && (
                  <div className="space-y-2">
                    {testCaseResults.map((tc, idx) => {
                      const passed = tc.status === 'passed';
                      const failed = tc.status === 'failed';
                      return (
                        <details key={tc.id || idx} className={`group rounded-lg border overflow-hidden ${passed ? 'border-green-500/30 bg-green-500/5'
                            : failed ? 'border-red-500/30 bg-red-500/5'
                              : 'border-zinc-300 bg-zinc-50'
                          }`}>
                          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none list-none">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${passed ? 'bg-green-500' : failed ? 'bg-red-500' : 'bg-zinc-400'
                                }`}>
                                {passed ? (
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-zinc-900">Case #{idx + 1}</span>
                              <span className={`text-xs font-medium ${passed ? 'text-green-600' : failed ? 'text-red-600' : 'text-zinc-500'}`}>
                                {tc.status.charAt(0).toUpperCase() + tc.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                                {tc.pointsEarned} / {tc.pointsAvailable} pts
                              </span>
                              <svg className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </div>
                          </summary>
                          <div className="border-t border-zinc-200 px-4 py-3 space-y-2 bg-white/60">
                            {[
                              { label: 'Input', value: tc.input, mono: true },
                              { label: 'Expected', value: tc.expectedOutput, mono: true },
                              { label: 'Got', value: tc.actualOutput, mono: true },
                              tc.errorMessage ? { label: 'Error', value: tc.errorMessage, mono: false } : null,
                            ].filter(Boolean).map((row: any) => (
                              <div key={row.label} className="flex gap-3 text-xs">
                                <span className="text-zinc-400 font-medium w-16 flex-shrink-0 pt-0.5">{row.label}:</span>
                                <span className={`text-zinc-700 break-all ${row.mono ? 'font-mono' : ''}`}>
                                  {String(row.value).substring(0, 200) || '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}

                {testCaseResults.length === 0 && !output && (
                  <div className="text-center py-16 text-zinc-400">
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    <p className="text-sm font-medium">No results yet</p>
                    <p className="text-xs mt-1">Run your code or test cases to see results here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Drag Handle ── */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className={`w-1 flex-shrink-0 bg-zinc-200 hover:bg-zinc-400 cursor-col-resize transition-colors ${isDragging ? 'bg-zinc-400' : ''}`}
        />

        {/* ── RIGHT: Code Editor Panel ── */}
        <div
          style={{ width: `${100 - leftPanelWidth}%` }}
          className="flex flex-col bg-zinc-950 min-h-0"
        >
          {/* Editor toolbar */}
          <div className="flex items-center px-4 py-2.5 border-b border-zinc-800 bg-zinc-900 flex-shrink-0 gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
            </div>
            <span className="text-xs text-zinc-500 font-mono">{langIcons[language]} solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : 'cpp'}</span>
            <div className="flex-1" />
            <button
              onClick={() => { if (question) setCode(getStarterCode(question, language)); }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
              title="Reset to starter code"
            >
              Reset
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor value={code} onChange={setCode} language={language} />
          </div>

          {/* ── Bottom: Custom Input / Output ── */}
          <div className="h-[220px] border-t border-zinc-800 flex-shrink-0 bg-zinc-900">
            <div className="grid grid-cols-2 h-full divide-x divide-zinc-800">

              {/* Custom Input */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 flex-shrink-0">
                  <span className="text-xs font-semibold text-zinc-400 tracking-wide">Custom Input</span>
                  <button
                    onClick={runCode}
                    disabled={loading}
                    className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors font-medium disabled:opacity-40"
                  >
                    {loading ? 'Running…' : '▶ Run'}
                  </button>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-transparent text-zinc-300 px-4 py-3 font-mono text-xs focus:outline-none resize-none placeholder-zinc-700 leading-relaxed"
                  placeholder="Enter test input..."
                />
              </div>

              {/* Output */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 flex-shrink-0">
                  <span className="text-xs font-semibold text-zinc-400 tracking-wide">Output</span>
                  {output && (
                    <button
                      onClick={() => { setOutput(''); setTestCaseResults([]); }}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {output ? (
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">{output}</pre>
                  ) : (
                    <p className="text-xs text-zinc-700 font-mono">Output will appear here...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="h-7 bg-zinc-900 border-t border-zinc-800 flex items-center px-4 gap-6 flex-shrink-0">
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              {totalTests > 0 && (
                <>
                  <span>
                    Tests: <span className={`font-semibold ${passedTests === totalTests ? 'text-green-500' : 'text-red-500'}`}>{passedTests}/{totalTests}</span>
                  </span>
                  <span>
                    Score: <span className="text-zinc-400 font-semibold">{score}/{maxScore}</span>
                  </span>
                </>
              )}
              <span className="ml-auto">{language.charAt(0).toUpperCase() + language.slice(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

