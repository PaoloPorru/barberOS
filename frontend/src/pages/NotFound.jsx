import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <p className="font-display text-[120px] text-gold/20 leading-none">404</p>
        <h1 className="font-display text-3xl tracking-wider mb-3">PAGINA NON TROVATA</h1>
        <p className="text-cream/50 mb-8">Sembra che tu ti sia perso. Torna alla home.</p>
        <Link to="/" className="btn-primary">← Torna alla Home</Link>
      </div>
    </div>
  );
}
