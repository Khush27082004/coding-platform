import { useState } from 'react';
import api from '../../services/api';
import { AppShell } from '../../components/AppShell';

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

  return (
    <AppShell 
      title="System settings" 
      subtitle="Critical platform management and database integrity controls."
    >
      <div className="max-w-4xl space-y-12">
        <section>
          <div className="flex items-center justify-between gap-4 mb-8 border-b border-zinc-100 pb-4">
            <h2 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Danger Zone Protocol
            </h2>
            <div className="h-1 flex-1 bg-zinc-50 rounded-full ml-4 hidden sm:block" />
          </div>

          <div className="grid gap-4">
            {/* Reset Attempts */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8 hover:border-zinc-900 transition-all shadow-sm">
              <div className="max-w-xl">
                <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Flush Session Data</h3>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-3">
                  Purge all assessment attempts and submissions. Entities remain intact; performance data is zeroed.
                </p>
              </div>
              <button
                onClick={() => handleAction('reset', '/reset-attempts', 'Reset all test attempts and submissions?')}
                disabled={loading !== null}
                className="shrink-0 rounded-xl bg-zinc-900 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-lg shadow-zinc-200"
              >
                {loading === 'reset' ? 'EXECUTING...' : 'INITIATE RESET'}
              </button>
            </div>

            {/* Delete All Student Data */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8 hover:border-zinc-900 transition-all shadow-sm">
              <div className="max-w-xl">
                <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Wipe Candidate Registry</h3>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-3">
                  Permanent removal of all candidate credentials, logs, and scoring history. Administrative nodes persist.
                </p>
              </div>
              <button
                onClick={() => handleAction('students', '/delete-students', 'Delete ALL student accounts and their data?')}
                disabled={loading !== null}
                className="shrink-0 rounded-xl border border-red-500 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-30 transition-all"
              >
                {loading === 'students' ? 'PURGING...' : 'EXECUTE FULL WIPE'}
              </button>
            </div>

            {/* Delete All Tests */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8 hover:border-zinc-900 transition-all shadow-sm">
              <div className="max-w-xl">
                <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Terminate Library Protocol</h3>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-3">
                  Irreversible deletion of all assessments, questions, and associated validation parameters from core database.
                </p>
              </div>
              <button
                onClick={() => handleAction('tests', '/delete-tests', 'Delete ALL assessments and questions?')}
                disabled={loading !== null}
                className="shrink-0 rounded-xl bg-red-600 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-red-700 disabled:opacity-30 transition-all shadow-xl shadow-red-100"
              >
                {loading === 'tests' ? 'TERMINATING...' : 'PURGE ASSET LIBRARY'}
              </button>
            </div>
          </div>
        </section>

        <section className="pt-8 border-t border-zinc-100">
          <div className="flex items-start gap-4 p-8 rounded-2xl bg-zinc-50 border border-zinc-100">
            <span className="text-xl">ℹ️</span>
            <div>
              <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] mb-2">Operational Integrity Notice</h4>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                All high-level data management operations are recorded in the system audit logs. These actions commit immediate changes to the production database and cannot be reverted once initialized.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};
