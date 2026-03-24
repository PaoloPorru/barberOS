// ─── Spinner ─────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={`${s} border-2 border-dark-border border-t-gold rounded-full animate-spin`} />
  );
}

// ─── PageHeader ──────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-display text-4xl tracking-wider text-cream">{title}</h1>
        {subtitle && <p className="text-cream/50 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    CONFIRMED: 'badge-confirmed',
    PENDING:   'badge-pending',
    CANCELLED: 'badge-cancelled',
    COMPLETED: 'badge-completed',
  };
  const labels = {
    CONFIRMED: 'Confermato',
    PENDING:   'In attesa',
    CANCELLED: 'Cancellato',
    COMPLETED: 'Completato',
  };
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{labels[status] || status}</span>;
}

// ─── EmptyState ──────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-cream mb-2">{title}</h3>
      {subtitle && <p className="text-cream/40 text-sm mb-6 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-card border border-dark-border rounded-sm w-full max-w-lg
                      max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="font-display text-2xl tracking-wider">{title}</h2>
          <button onClick={onClose} className="text-cream/40 hover:text-cream text-xl">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = 'gold' }) {
  const colors = {
    gold:  'border-l-gold',
    green: 'border-l-green-500',
    blue:  'border-l-blue-500',
    red:   'border-l-red-500',
  };
  return (
    <div className={`card border-l-2 ${colors[accent]}`}>
      <p className="label">{label}</p>
      <p className="text-3xl font-display tracking-wider text-cream mt-1">{value}</p>
      {sub && <p className="text-xs text-cream/40 mt-1">{sub}</p>}
    </div>
  );
}

// ─── FormField ───────────────────────────────────────────────
export function FormField({ label, error, children }) {
  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ─── ConfirmDialog ───────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-cream/70 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-ghost" onClick={onClose}>Annulla</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Eliminazione...' : 'Conferma'}
        </button>
      </div>
    </Modal>
  );
}
