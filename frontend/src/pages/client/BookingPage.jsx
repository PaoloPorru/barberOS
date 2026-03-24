import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesAPI, barbersAPI, slotsAPI, appointmentsAPI } from '../../api';
import { useBookingStore } from '../../store/bookingStore';
import { PageHeader, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { it } from 'date-fns/locale';

// ─── Step 1: Scegli Servizio ──────────────────────────────────
function StepService({ onNext }) {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { service: selected, setService } = useBookingStore();

  useEffect(() => {
    servicesAPI.getAll().then(r => setServices(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wider mb-6">Scegli il Servizio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {services.map(s => (
          <button key={s.id} onClick={() => setService(s)}
            className={`card text-left transition-all hover:border-gold/40 ${
              selected?.id === s.id ? 'border-gold bg-gold/5' : ''
            }`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-cream">{s.name}</h3>
              <span className="font-display text-2xl text-gold">€{s.price}</span>
            </div>
            <p className="text-cream/50 text-sm mb-3">{s.description}</p>
            <p className="font-mono text-xs text-cream/40">⏱ {s.duration_minutes} minuti</p>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={!selected} onClick={onNext}>
          Continua →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Scegli Barbiere ──────────────────────────────────
function StepBarber({ onNext, onBack }) {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { barber: selected, setBarber } = useBookingStore();

  useEffect(() => {
    barbersAPI.getAll().then(r => setBarbers(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wider mb-6">Scegli il Barbiere</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {barbers.map(b => (
          <button key={b.id} onClick={() => setBarber(b)}
            className={`card text-center transition-all hover:border-gold/40 ${
              selected?.id === b.id ? 'border-gold bg-gold/5' : ''
            }`}>
            <div className="w-16 h-16 rounded-full bg-dark-border mx-auto mb-3 flex items-center justify-center text-2xl"
              style={{ borderColor: b.color_hex, borderWidth: 2, borderStyle: 'solid' }}>
              ✂️
            </div>
            <h3 className="font-semibold">{b.user?.first_name} {b.user?.last_name}</h3>
            {b.bio && <p className="text-cream/40 text-xs mt-2 line-clamp-2">{b.bio}</p>}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <button className="btn-ghost" onClick={onBack}>← Indietro</button>
        <button className="btn-primary" disabled={!selected} onClick={onNext}>Continua →</button>
      </div>
    </div>
  );
}

// ─── Step 3: Scegli Data ──────────────────────────────────────
function StepDate({ onNext, onBack }) {
  const { date: selected, setDate } = useBookingStore();
  const today = startOfToday();
  const days  = Array.from({ length: 30 }, (_, i) => addDays(today, i + 1));

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wider mb-6">Scegli la Data</h2>
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-8">
        {days.map(day => {
          const iso = format(day, 'yyyy-MM-dd');
          const dow = day.getDay();
          const isSun = dow === 0;
          return (
            <button key={iso} disabled={isSun}
              onClick={() => setDate(iso)}
              className={`py-3 px-2 rounded-sm text-center transition-all text-sm
                ${isSun ? 'opacity-20 cursor-not-allowed' : 'hover:border-gold/40'}
                ${selected === iso
                  ? 'bg-gold text-[#0a0a0a] font-semibold'
                  : 'card hover:bg-gold/5'
                }`}>
              <div className="font-mono text-xs mb-1 opacity-60">
                {format(day, 'EEE', { locale: it })}
              </div>
              <div className="font-semibold">{format(day, 'd')}</div>
              <div className="text-xs opacity-60">{format(day, 'MMM', { locale: it })}</div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between">
        <button className="btn-ghost" onClick={onBack}>← Indietro</button>
        <button className="btn-primary" disabled={!selected} onClick={onNext}>Continua →</button>
      </div>
    </div>
  );
}

// ─── Step 4: Scegli Slot ──────────────────────────────────────
function StepSlot({ onNext, onBack }) {
  const { barber, date, service, slot: selected, setSlot } = useBookingStore();
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barber || !date || !service) return;
    setLoading(true);
    slotsAPI.getAvailable(barber.id, date, service.id)
      .then(r => setSlots(r.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [barber, date, service]);

  const formatted = date ? format(new Date(date + 'T12:00:00'), "EEEE d MMMM yyyy", { locale: it }) : '';

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wider mb-2">Scegli l'Orario</h2>
      <p className="text-cream/50 text-sm mb-6 capitalize">{formatted}</p>

      {slots.length === 0 ? (
        <div className="card text-center py-12 mb-8">
          <p className="text-3xl mb-3">😞</p>
          <p className="text-cream/60">Nessuno slot disponibile per questa data.</p>
          <p className="text-cream/40 text-sm mt-1">Prova un altro giorno o un altro barbiere.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-8">
          {slots.map((s, i) => (
            <button key={i}
              onClick={() => setSlot(s)}
              className={`py-3 rounded-sm text-sm font-mono transition-all
                ${selected?.label === s.label
                  ? 'bg-gold text-[#0a0a0a] font-semibold'
                  : 'card hover:border-gold/40 hover:bg-gold/5'
                }`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-between">
        <button className="btn-ghost" onClick={onBack}>← Indietro</button>
        <button className="btn-primary" disabled={!selected} onClick={onNext}>Continua →</button>
      </div>
    </div>
  );
}

// ─── Step 5: Conferma ─────────────────────────────────────────
function StepConfirm({ onBack }) {
  const { service, barber, date, slot, notes, setNotes, reset } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formattedDate = date
    ? format(new Date(date + 'T12:00:00'), "EEEE d MMMM yyyy", { locale: it })
    : '';

  async function handleConfirm() {
    setLoading(true);
    try {
      await appointmentsAPI.create({
        barber_id:      barber.id,
        service_id:     service.id,
        start_datetime: slot.start,
        notes,
      });
      toast.success('Appuntamento confermato! Controlla la tua email.');
      reset();
      navigate('/appointments');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore durante la prenotazione');
    } finally { setLoading(false); }
  }

  return (
    <div>
      <h2 className="font-display text-3xl tracking-wider mb-6">Conferma Prenotazione</h2>
      <div className="card mb-6 space-y-4">
        <Row label="Servizio"  value={service?.name} sub={`€${service?.price} · ${service?.duration_minutes} min`} />
        <Row label="Barbiere"  value={`${barber?.user?.first_name} ${barber?.user?.last_name}`} />
        <Row label="Data"      value={<span className="capitalize">{formattedDate}</span>} />
        <Row label="Orario"    value={slot?.label} />
      </div>
      <div className="mb-6">
        <label className="label">Note per il barbiere (opzionale)</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Es. Preferisco i capelli più corti sui lati..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="card bg-gold/5 border-gold/20 mb-6">
        <p className="text-xs font-mono text-gold/80">
          ✉️ Riceverai una email di conferma all'indirizzo registrato.
        </p>
      </div>
      <div className="flex justify-between">
        <button className="btn-ghost" onClick={onBack} disabled={loading}>← Indietro</button>
        <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Prenotazione...' : '✓ Conferma Appuntamento'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, sub }) {
  return (
    <div className="flex items-start justify-between border-b border-dark-border pb-4 last:border-0 last:pb-0">
      <span className="font-mono text-xs text-cream/40 uppercase tracking-wider w-24">{label}</span>
      <div className="text-right">
        <span className="text-cream font-medium">{value}</span>
        {sub && <p className="text-cream/40 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────
const STEPS = ['Servizio', 'Barbiere', 'Data', 'Orario', 'Conferma'];

export default function BookingPage() {
  const { step, nextStep, prevStep } = useBookingStore();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader title="PRENOTA" subtitle="Scegli il tuo appuntamento in pochi click" />

      {/* Progress */}
      <div className="flex items-center mb-10">
        {STEPS.map((label, i) => {
          const num   = i + 1;
          const done  = num < step;
          const active = num === step;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono
                  transition-all ${
                    done   ? 'bg-gold text-[#0a0a0a]' :
                    active ? 'border-2 border-gold text-gold' :
                             'border border-dark-border text-cream/30'
                  }`}>
                  {done ? '✓' : num}
                </div>
                <span className={`text-xs mt-1 font-mono hidden md:block ${
                  active ? 'text-gold' : 'text-cream/30'
                }`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${done ? 'bg-gold' : 'bg-dark-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Steps */}
      {step === 1 && <StepService  onNext={nextStep} />}
      {step === 2 && <StepBarber   onNext={nextStep} onBack={prevStep} />}
      {step === 3 && <StepDate     onNext={nextStep} onBack={prevStep} />}
      {step === 4 && <StepSlot     onNext={nextStep} onBack={prevStep} />}
      {step === 5 && <StepConfirm  onBack={prevStep} />}
    </div>
  );
}
