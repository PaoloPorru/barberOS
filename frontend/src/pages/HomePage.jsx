import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-8 py-20 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full opacity-5
                        bg-radial-gradient" style={{
          background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="relative z-10 max-w-3xl">
          <p className="font-mono text-xs tracking-[4px] text-gold mb-6 uppercase">
            Sistema di Gestione Appuntamenti
          </p>
          <h1 className="font-display text-7xl md:text-9xl tracking-[4px] mb-6 leading-none">
            BARBER<span className="text-gold">OS</span>
          </h1>
          <p className="text-cream/60 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Prenota il tuo appuntamento in tre click. Gestisci il tuo salone con stile.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register" className="btn-primary px-8 py-4 text-base">
              Prenota Ora →
            </Link>
            <Link to="/login" className="btn-ghost px-8 py-4 text-base">
              Accedi
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-dark-border px-8 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: '✂️', title: 'Prenota in 3 Click', desc: 'Scegli servizio, barbiere e orario. Conferma in un attimo.' },
            { icon: '📅', title: 'Calendario Sync', desc: 'Il tuo barbiere vede sempre il calendario aggiornato in tempo reale.' },
            { icon: '✉️', title: 'Conferma via Email', desc: 'Ricevi conferma immediata e promemoria 24h prima dell\'appuntamento.' },
          ].map(f => (
            <div key={f.title}>
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-display text-xl tracking-wider mb-2">{f.title}</h3>
              <p className="text-cream/50 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
