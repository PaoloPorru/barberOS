import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../../api';
import { PageHeader, StatusBadge, EmptyState, ConfirmDialog, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [cancelId,  setCancelId]  = useState(null);
  const [cancelling,setCancelling]= useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await appointmentsAPI.getAll({ limit: 50 });
      setAppointments(data.data);
    } catch { toast.error('Errore nel caricamento'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await appointmentsAPI.cancel(cancelId);
      toast.success('Appuntamento cancellato');
      setCancelId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore');
    } finally { setCancelling(false); }
  }

  // Split upcoming / past
  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.start_datetime) >= now && a.status !== 'CANCELLED');
  const past     = appointments.filter(a => new Date(a.start_datetime) <  now || a.status === 'CANCELLED');

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="I MIEI APPUNTAMENTI"
        subtitle={`${upcoming.length} prossimi · ${past.length} passati`}
        action={<Link to="/book" className="btn-primary">+ Prenota</Link>}
      />

      {/* Upcoming */}
      <section className="mb-10">
        <h2 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-4">Prossimi</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Nessun appuntamento in programma"
            subtitle="Prenota il tuo prossimo taglio in pochi click"
            action={<Link to="/book" className="btn-primary">Prenota ora</Link>}
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map(apt => <AppointmentCard key={apt.id} apt={apt} onCancel={() => setCancelId(apt.id)} />)}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-4">Storico</h2>
          <div className="space-y-3 opacity-60">
            {past.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        loading={cancelling}
        title="Cancella Appuntamento"
        message="Sei sicuro di voler cancellare questo appuntamento? L'azione non è reversibile."
      />
    </div>
  );
}

function AppointmentCard({ apt, onCancel }) {
  const start = new Date(apt.start_datetime);
  const canCancel = apt.status === 'CONFIRMED' && start > new Date();

  return (
    <div className="card flex items-center gap-6">
      {/* Date block */}
      <div className="text-center min-w-[60px]" style={{ color: apt.barber?.color_hex || '#c9a84c' }}>
        <div className="font-display text-3xl leading-none">{format(start, 'd')}</div>
        <div className="font-mono text-xs uppercase mt-1">{format(start, 'MMM', { locale: it })}</div>
      </div>

      {/* Details */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-semibold text-cream">{apt.service?.name}</span>
          <StatusBadge status={apt.status} />
        </div>
        <p className="text-cream/50 text-sm">
          {format(start, 'EEEE', { locale: it })} · {format(start, 'HH:mm')} ·{' '}
          {apt.barber?.user?.first_name} {apt.barber?.user?.last_name}
        </p>
      </div>

      {/* Price + action */}
      <div className="text-right">
        <p className="font-display text-xl text-gold">€{apt.price_snapshot}</p>
        {canCancel && (
          <button onClick={onCancel}
            className="text-xs text-red-400 hover:text-red-300 mt-1 font-mono transition-colors">
            cancella
          </button>
        )}
      </div>
    </div>
  );
}
