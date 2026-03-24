import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';

const clientNav = [
  { to: '/book',         label: 'Prenota',        icon: '✂️' },
  { to: '/appointments', label: 'Appuntamenti',    icon: '📋' },
];

const barberNav = [
  { to: '/barber/calendar',     label: 'Calendario',    icon: '📅' },
  { to: '/barber/availability', label: 'Disponibilità', icon: '⏰' },
];

const adminNav = [
  { to: '/admin',              label: 'Dashboard',      icon: '📊' },
  { to: '/admin/appointments', label: 'Prenotazioni',   icon: '📋' },
  { to: '/admin/barbers',      label: 'Barbieri',       icon: '✂️' },
  { to: '/admin/services',     label: 'Servizi',        icon: '💈' },
];

export default function AppLayout() {
  const { user, logout, isAdmin, isBarber } = useAuthStore();
  const navigate = useNavigate();

  const nav = isAdmin() ? adminNav : isBarber() ? barberNav : clientNav;

  async function handleLogout() {
    try { await authAPI.logout(); } catch {}
    logout();
    navigate('/login');
    toast.success('Logout effettuato');
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-dark-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-dark-border">
          <span className="font-display text-2xl tracking-[3px]">
            BARBER<span className="text-gold">OS</span>
          </span>
          {/* Role badge */}
          <div className="mt-2">
            <span className={`badge text-[10px] tracking-widest ${
              isAdmin()  ? 'bg-gold/10 text-gold border border-gold/20' :
              isBarber() ? 'bg-green-900/30 text-green-400 border border-green-900/40' :
                           'bg-blue-900/30 text-blue-400 border border-blue-900/40'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-all ${
                  isActive
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'text-cream/50 hover:text-cream hover:bg-white/5'
                }`
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-dark-border">
          <div className="px-4 py-3 mb-2">
            <p className="text-sm font-medium text-cream truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-cream/40 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-xs text-cream/40
                       hover:text-red-400 transition-colors font-mono tracking-wider uppercase"
          >
            → Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
