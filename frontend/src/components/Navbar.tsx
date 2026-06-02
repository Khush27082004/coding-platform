import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all ${isActive
    ? 'bg-zinc-900 text-white shadow-md'
    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
  }`;

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white font-black text-sm shadow-xl shadow-zinc-200">
              C7
            </div>
            <div className="hidden sm:block">
              <span className="block text-sm font-black text-zinc-900 tracking-tighter uppercase">Code7</span>
              <span className="block text-[9px] text-zinc-400 font-bold uppercase tracking-widest -mt-0.5">Platform</span>
            </div>
          </button>

          {user && (
            <>
              <nav className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-2xl">
                {user.role === 'admin' ? (
                  <>
                    <NavLink to="/admin/questions" className={linkClass}>
                      Questions
                    </NavLink>
                    <NavLink to="/admin/assessments" className={linkClass}>
                      Assessments
                    </NavLink>
                    <NavLink to="/admin/settings" className={linkClass}>
                      Settings
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/" end className={linkClass}>
                      Home
                    </NavLink>
                    <NavLink to="/practice" className={linkClass}>
                      Practice
                    </NavLink>
                    <NavLink to="/submissions" className={linkClass}>
                      Submissions
                    </NavLink>
                  </>
                )}
              </nav>

              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-bold text-zinc-900 leading-none">
                    {user.fullName}
                  </span>
                  <span className="text-[9px] font-black text-zinc-400 tracking-widest uppercase mt-0.5">
                    {user.role}
                  </span>
                </div>
                <div className="h-5 w-px bg-zinc-200" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-black text-zinc-500 hover:text-red-600 uppercase tracking-widest transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        {user && (
          <nav className="md:hidden flex gap-1 pb-3 overflow-x-auto border-t border-zinc-100 pt-2 -mx-1 px-1">
            {user.role === 'admin' ? (
              <>
                <NavLink to="/admin/questions" className={linkClass}>
                  Questions
                </NavLink>
                <NavLink to="/admin/assessments" className={linkClass}>
                  Assessments
                </NavLink>
                <NavLink to="/admin/settings" className={linkClass}>
                  Settings
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/" end className={linkClass}>
                  Home
                </NavLink>
                <NavLink to="/practice" className={linkClass}>
                  Practice
                </NavLink>
                <NavLink to="/submissions" className={linkClass}>
                  History
                </NavLink>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
