import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { PageHeader, StatusBadge, Spinner, Modal } from '../../components/ui';
import toast from 'react-hot-toast';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9–19

export default function BarberCalendar() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [weekStart,    setWeekStart]    = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selected,     setSelected]     = useState(null);

  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)); // Lun-Sab

  useEffect(() => {
    const from = format(weekStart, 'yyyy-MM-dd');
    const to   = format(addDays(weekStart, 5), 'yyyy-MM-dd');
    appointmentsAPI.getAll({ date_from: from, date_to: to, limit: 200 })
      .then(r => setAppointments(r.data.data))
      .catch(() => toast.error('Errore caricamento'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  async function handleStatusChange(id, status) {
    try {
      await appointmentsAPI.setStatus(id, status);
      toast.success('Stato aggiornato');
      setSelected(null);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { toast.error('Errore'); }
  }

  // Get appointments for a specific day+hour slot
  function getApts(day, hour) {
    return appointments.filter(a => {
      const d = new Date(a.start_datetime);
      return isSameDay(d, day) && d.getHours() === hour;
    });
  }

  return (
    <div className="p-8">
      <PageHeader
        title="CALENDARIO"
        subtitle={`Settimana del ${format(weekStart, 'd MMM', { locale: it })}`}
        action={
          <div className="flex gap-2">
            <button className="btn-ghost px-4 py-2"
              onClick={() => setWeekStart(w => addDays(w, -7))}>← Prec.</button>
            <button className="btn-ghost px-4 py-2"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Oggi</button>
            <button className="btn-ghost px-4 py-2"
              onClick={() => setWeekStart(w => addDays(w, 7))}>Succ. →</button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header days */}
            <div className="grid grid-cols-7 mb-2">
              <div className="w-16" /> {/* hour col */}
              {days.map(day => (
                <div key={day.toString()} className={`text-center py-2 ${isSameDay(day, new Date()) ? 'text-gold' : 'text-cream/60'}`}>
                  <div className="font-mono text-xs uppercase">{format(day, 'EEE', { locale: it })}</div>
                  <div className={`font-display text-2xl ${isSameDay(day, new Date()) ? 'text-gold' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid */}
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-7 border-t border-dark-border">
                {/* Hour label */}
                <div className="w-16 py-3 text-right pr-4 font-mono text-xs text-cream/30 self-start pt-3">
                  {hour}:00
                </div>
                {/* Day cells */}
                {days.map(day => {
                  const apts = getApts(day, hour);
                  return (
                    <div key={day.toString()} className="border-l border-dark-border min-h-[60px] p-1 relative">
                      {apts.map(a => (
                        <button key={a.id}
                          onClick={() => setSelected(a)}
                          className="w-full text-left p-2 rounded-sm mb-1 text-xs transition-all hover:opacity-90"
                          style={{ background: `${a.barber?.color_hex || '#c9a84c'}20`,
                                   borderLeft: `3px solid ${a.barber?.color_hex || '#c9a84c'}` }}>
                          <div className="font-semibold text-cream truncate">
                            {a.client?.first_name} {a.client?.last_name}
                          </div>
                          <div className="text-cream/50">{a.service?.name}</div>
                          <StatusBadge status={a.status} />
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Dettaglio Appuntamento">
        {selected && (
          <div className="space-y-4">
            <Row label="Cliente"  value={`${selected.client?.first_name} ${selected.client?.last_name}`} />
            <Row label="Email"    value={selected.client?.email} />
            <Row label="Telefono" value={selected.client?.phone || '—'} />
            <Row label="Servizio" value={selected.service?.name} />
            <Row label="Data"
              value={format(new Date(selected.start_datetime), "d MMMM yyyy 'alle' HH:mm", { locale: it })} />
            <Row label="Durata"   value={`${selected.service?.duration_minutes} min`} />
            <Row label="Prezzo"   value={`€${selected.price_snapshot}`} />
            {selected.notes && <Row label="Note" value={selected.notes} />}
            <div className="pt-4 border-t border-dark-border">
              <StatusBadge status={selected.status} />
            </div>
            {selected.status === 'CONFIRMED' && (
              <div className="flex gap-3 pt-2">
                <button className="btn-primary flex-1"
                  onClick={() => handleStatusChange(selected.id, 'COMPLETED')}>
                  ✓ Completato
                </button>
                <button className="btn-danger flex-1"
                  onClick={() => handleStatusChange(selected.id, 'CANCELLED')}>
                  ✕ Cancella
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-dark-border pb-3">
      <span className="font-mono text-xs text-cream/40 uppercase">{label}</span>
      <span className="text-cream text-sm">{value}</span>
    </div>
  );
}
