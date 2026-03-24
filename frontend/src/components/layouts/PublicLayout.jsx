import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-dark-border px-8 py-5 flex items-center justify-between">
        <Link to="/" className="font-display text-3xl tracking-[4px] text-cream hover:text-gold transition-colors">
          BARBER<span className="text-gold">OS</span>
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link to="/login"    className="text-cream/60 hover:text-gold transition-colors">Accedi</Link>
          <Link to="/register" className="btn-primary px-4 py-2">Registrati</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
