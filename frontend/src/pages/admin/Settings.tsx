import { useState } from 'react';
import api from '../../services/api';
import { AppShell } from '../../components/AppShell';
import { AlertTriangle, RotateCcw, UserX, Trash2 } from 'lucide-react';

export const Settings = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, endpoint: string, message: string) => {
    if (!confirm(`⚠️ SYSTEM_WARNING: ${message}\n\nThis action is irreversible. Are you absolutely sure?`)) {
      return;
    }
    setLoading(action);
    try {
      const res = await api.post(`/admin${endpoint}`);
      alert(res.data.message || 'Operation successful.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const dangerActions = [
    {
      id: 'reset',
      icon: <RotateCcw size={20} className="text-amber-400" />,
      title: 'Flush Session Data',
      desc: 'Purge all assessment attempts and submissions. Entities remain intact; performance data is zeroed.',
      btnLabel: 'Initiate Reset',
      btnLoading: 'Executing…',
      endpoint: '/reset-attempts',
      message: 'Reset all test attempts and submissions?',
      variant: 'amber',
    },
    {
      id: 'students',
      icon: <UserX size={20} className="text-red-400" />,
      title: 'Wipe Candidate Registry',
      desc: 'Permanent removal of all candidate credentials, logs, and scoring history. Administrative nodes persist.',
      btnLabel: 'Execute Full Wipe',
      btnLoading: 'Purging…',
      endpoint: '/delete-students',
      message: 'Delete ALL student accounts and their data?',
      variant: 'red',
    },
    {
      id: 'tests',
      icon: <Trash2 size={20} className="text-red-400" />,
      title: 'Terminate Library Protocol',
      desc: 'Irreversible deletion of all assessments, questions, and associated validation parameters from core database.',
      btnLabel: 'Purge Asset Library',
      btnLoading: 'Terminating…',
      endpoint: '/delete-tests',
      message: 'Delete ALL assessments and questions?',
      variant: 'red',
    },
  ];

  return (
    <AppShell
      title="System Settings"
      subtitle="Critical platform management and database integrity controls."
    >
      <div className="max-w-3xl space-y-6 animate-fade-in">
        {/* Warning banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-400">Danger Zone</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              All high-level data management operations are recorded in the system audit logs. These actions commit
              immediate changes to the production database and cannot be reverted once initialized.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {dangerActions.map((action) => (
            <div
              key={action.id}
              className={`card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-${action.variant}-500/25 transition-colors`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-${action.variant}-500/10 border border-${action.variant}-500/15`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{action.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">{action.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleAction(action.id, action.endpoint, action.message)}
                disabled={loading !== null}
                className={`shrink-0 btn-danger disabled:opacity-40 text-xs ${
                  action.variant === 'amber'
                    ? 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50'
                    : ''
                }`}
              >
                {loading === action.id ? (
                  <><div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> {action.btnLoading}</>
                ) : (
                  action.btnLabel
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <span className="text-lg shrink-0">ℹ️</span>
          <div>
            <p className="text-xs font-bold text-slate-300 mb-1">Operational Integrity Notice</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              All high-level data management operations are recorded in the system audit logs. These actions commit
              immediate changes to the production database and cannot be reverted once initialized.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
