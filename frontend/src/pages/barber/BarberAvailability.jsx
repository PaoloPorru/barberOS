import { useState, useEffect } from 'react';
import { barbersAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { PageHeader, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

const DAYS = [
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
  { value: 0, label: 'Domenica' },
];

const DEFAULT_SCHEDULE = DAYS.map(d => ({
  day_of_week: d.value,
  start_time:  '09:00',
  end_time:    '18:00',
  is_active:   d.value !== 0,
}));

export default function BarberAvailability() {
  const { user } = useAuthStore();
  const [barberId,  setBarberId]  = useState(null);
  const [schedule,  setSchedule]  = useState(DEFAULT_SCHEDULE);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    // Get barber profile
    barbersAPI.getAll().then(r => {
      const me = r.data.data.find(b => b.user_id === user.id || b.user?.id === user.id);
      if (me) {
        setBarberId(me.id);
        return barbersAPI.getAvailability(me.id);
      }
    }).then(r => {
      if (r?.data?.data?.length) {
        // Merge with defaults
        const saved = r.data.data;
        setSchedule(DEFAULT_SCHEDULE.map(def => {
          const found = saved.find(s => s.day_of_week === def.day_of_week);
          return found ? {
            day_of_week: found.day_of_week,
            start_time:  found.start_time?.slice(0,5) || def.start_time,
            end_time:    found.end_time?.slice(0,5)   || def.end_time,
            is_active:   found.is_active,
          } : def;
        }));
      }
    }).catch(() => toast.error('Errore caricamento'))
    .finally(() => setLoading(false));
  }, [user.id]);

  function update(idx, field, value) {
    setSchedule(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  }

  async function handleSave() {
    if (!barberId) return;
    setSaving(true);
    try {
      await barbersAPI.setAvailability(barberId, { availability: schedule });
      toast.success('Disponibilità salvata!');
    } catch { toast.error('Errore nel salvataggio'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader title="DISPONIBILITÀ" subtitle="Imposta i tuoi orari di lavoro settimanali" />

      <div className="space-y-3 mb-8">
        {DAYS.map((day, i) => {
          const row = schedule[i];
          return (
            <div key={day.value}
              className={`card transition-all ${row.is_active ? '' : 'opacity-40'}`}>
              <div className="flex items-center gap-4">
                {/* Toggle */}
                <button
                  onClick={() => update(i, 'is_active', !row.is_active)}
                  className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${
                    row.is_active ? 'bg-gold' : 'bg-dark-border'
                  }`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-[#0a0a0a] transition-all ${
                    row.is_active ? 'left-5' : 'left-1'
                  }`} />
                </button>

                {/* Day label */}
                <span className="w-28 font-medium text-sm">{day.label}</span>

                {/* Times */}
                {row.is_active && (
                  <div className="flex items-center gap-3 flex-1">
                    <input type="time" value={row.start_time}
                      onChange={e => update(i, 'start_time', e.target.value)}
                      className="input w-32 py-2" />
                    <span className="text-cream/40 font-mono text-sm">—</span>
                    <input type="time" value={row.end_time}
                      onChange={e => update(i, 'end_time', e.target.value)}
                      className="input w-32 py-2" />
                  </div>
                )}
                {!row.is_active && (
                  <span className="text-cream/30 text-sm font-mono">Giorno libero</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
        {saving ? 'Salvataggio...' : '✓ Salva Disponibilità'}
      </button>
    </div>
  );
}
