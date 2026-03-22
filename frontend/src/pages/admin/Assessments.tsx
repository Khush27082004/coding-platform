import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Assessment } from '../../types';
import { AppShell } from '../../components/AppShell';

type AssessmentResultRow = {
  userAssessmentId: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  score: number;
  maxScore: number;
  passed: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
};

type AssessmentResultsResponse = {
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    totalScore: number;
  };
  rows: AssessmentResultRow[];
};

export const Assessments = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);
  const [resultsByAssessment, setResultsByAssessment] = useState<Record<string, AssessmentResultsResponse>>({});
  const [resultsLoading, setResultsLoading] = useState<Record<string, boolean>>({});

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

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  };

  const loadAssessmentResults = async (assessmentId: string) => {
    setResultsLoading((prev) => ({ ...prev, [assessmentId]: true }));
    try {
      const res = await api.get(`/assessments/${assessmentId}/results`);
      setResultsByAssessment((prev) => ({
        ...prev,
        [assessmentId]: res.data.data,
      }));
    } catch (error) {
      console.error('Failed to fetch assessment results', error);
    } finally {
      setResultsLoading((prev) => ({ ...prev, [assessmentId]: false }));
    }
  };

  const toggleResults = async (assessmentId: string) => {
    const isOpen = expandedAssessmentId === assessmentId;
    if (isOpen) {
      setExpandedAssessmentId(null);
      return;
    }
    setExpandedAssessmentId(assessmentId);
    if (!resultsByAssessment[assessmentId]) {
      await loadAssessmentResults(assessmentId);
    }
  };

  if (loading) {
    return (
      <AppShell title="Tests & results" subtitle="Loading…">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500 text-sm">Loading assessments…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Tests & results"
      subtitle="Scheduled assessments and per-candidate scores. New tests are created via your database or API workflow."
      wide
    >
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90 mb-6">
        <strong className="font-medium text-amber-100">Note:</strong> This UI does not include a test builder yet. Use seed data or direct DB/API to add assessments, then assign candidates.
      </div>

      <div className="space-y-3">
        {assessments.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
          >
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{a.title}</h3>
                  {a.description ? <p className="mt-1 text-sm text-slate-400 max-w-2xl">{a.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{a.duration} min</span>
                    <span>{a.totalScore ?? '—'} pts total</span>
                    <span>Pass ≥ {a.passingScore}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleResults(a.id)}
                  className="shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                >
                  {expandedAssessmentId === a.id ? 'Hide scoreboard' : 'View scoreboard'}
                </button>
              </div>
            </div>

            {expandedAssessmentId === a.id && (
              <div className="border-t border-slate-800 bg-slate-950/50 px-5 sm:px-6 py-4">
                {resultsLoading[a.id] ? (
                  <p className="text-sm text-slate-500">Loading results…</p>
                ) : (resultsByAssessment[a.id]?.rows?.length || 0) === 0 ? (
                  <p className="text-sm text-slate-500">No candidates assigned to this test yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Score</th>
                          <th className="px-4 py-3">Result</th>
                          <th className="px-4 py-3">Started</th>
                          <th className="px-4 py-3">Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {resultsByAssessment[a.id].rows.map((row) => (
                          <tr key={row.userAssessmentId} className="text-slate-300">
                            <td className="px-4 py-3 font-medium text-white">{row.candidateName}</td>
                            <td className="px-4 py-3 text-slate-400">{row.candidateEmail}</td>
                            <td className="px-4 py-3 capitalize">{row.status.replace('_', ' ')}</td>
                            <td className="px-4 py-3 tabular-nums">
                              {row.score}/{row.maxScore}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={
                                  row.passed
                                    ? 'text-emerald-400 font-medium'
                                    : 'text-rose-400 font-medium'
                                }
                              >
                                {row.passed ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(row.startedAt)}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(row.completedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-16 text-center">
          <p className="text-slate-400 text-sm">No assessments in the system.</p>
          <p className="text-slate-600 text-xs mt-2">Add records via Prisma seed or API, then refresh.</p>
        </div>
      )}
    </AppShell>
  );
};
