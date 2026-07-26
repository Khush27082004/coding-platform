import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Settings,
  Code2,
  History,
  LogOut,
  Menu,
  X,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
};

const adminNav: NavItem[] = [
  { to: '/',                   label: 'Dashboard',   icon: <LayoutDashboard size={17} />, end: true },
  { to: '/admin/questions',    label: 'Questions',   icon: <BookOpen size={17} /> },
  { to: '/admin/assessments',  label: 'Assessments', icon: <ClipboardList size={17} /> },
  { to: '/admin/settings',     label: 'Settings',    icon: <Settings size={17} /> },
];

const candidateNav: NavItem[] = [
  { to: '/',             label: 'Dashboard',   icon: <LayoutDashboard size={17} />, end: true },
  { to: '/practice',     label: 'Practice',    icon: <Code2 size={17} /> },
  { to: '/submissions',  label: 'Submissions', icon: <History size={17} /> },
];

function NavItemLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        `nav-item ${isActive ? 'active' : ''}`
      }
    >
      <span className="shrink-0">{item.icon}</span>
      <span>{item.label}</span>
      <ChevronRight size={13} className="ml-auto opacity-0 group-[.active]:opacity-100 transition-opacity" />
    </NavLink>
  );
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'admin' ? adminNav : candidateNav;

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5">
        <button
          type="button"
          onClick={() => { navigate('/'); setOpen(false); }}
          className="flex items-center gap-3 w-full"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-600/30 shrink-0">
            C7
          </div>
          <div className="text-left">
            <span className="block text-sm font-black text-white tracking-tighter">Code7</span>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest -mt-0.5">
              {user?.role === 'admin' ? 'Admin Portal' : 'Candidate'}
            </span>
          </div>
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map((item) => (
          <NavItemLink key={item.to} item={item} onClick={() => setOpen(false)} />
        ))}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-none mb-0.5">
                {user.fullName}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {user.role}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden lg:flex flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-[#080e1a]/95 backdrop-blur-md border-b border-white/5">
        <button
          type="button"
          onClick={() => { navigate('/'); }}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs shadow-lg shadow-indigo-600/30">
            C7
          </div>
          <span className="text-sm font-black text-white tracking-tighter">Code7</span>
        </button>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay lg:hidden ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside className={`sidebar lg:hidden flex flex-col ${open ? 'open' : ''}`}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs">
              C7
            </div>
            <span className="text-sm font-black text-white tracking-tighter">Code7</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavItemLink key={item.to} item={item} onClick={() => setOpen(false)} />
          ))}
        </nav>

        {user && (
          <div className="border-t border-white/5 p-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate leading-none mb-0.5">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {user.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
