import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { PageHeader, StatCard, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const PERIODS = [
  { value: 'day', label: 'Oggi' },
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' },
];

function ColumnChart({ data, valueKey, labelKey, barClass }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1 h-[180px] pt-4 border-b border-dark-border">
      {data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const h = `${Math.max(6, (v / max) * 100)}%`;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className={`w-full max-w-[28px] mx-auto rounded-t ${barClass}`}
              style={{ height: h }}
              title={`${d[labelKey]}: ${v}`}
            />
            <span className="text-[10px] text-cream/40 truncate w-full text-center leading-tight">
              {d[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBars({ items }) {
  const max = Math.max(...items.map((x) => x.value), 1);
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs text-cream/60 mb-1 font-mono">
            <span>{item.name}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-2 bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAPI
      .getStats(period)
      .then((r) => setStats(r.data.data))
      .catch(() => toast.error('Errore caricamento statistiche'))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const dailyChart = (stats.dailyData || []).map((d) => ({
    date: format(new Date(d.date), 'd MMM', { locale: it }),
    appuntamenti: parseInt(d.count, 10),
    incassi: parseFloat(d.revenue || 0),
  }));

  const statusChart = Object.entries(stats.byStatus || {}).map(([k, v]) => ({
    name:
      { CONFIRMED: 'Conf.', CANCELLED: 'Canc.', COMPLETED: 'Compl.', PENDING: 'Attesa' }[k] || k,
    value: v,
    color:
      { CONFIRMED: '#4caf78', CANCELLED: '#e05c5c', COMPLETED: '#5c8fe0', PENDING: '#e8c97a' }[k] ||
      '#888',
  }));

  return (
    <div className="p-8">
      <PageHeader
        title="DASHBOARD"
        subtitle="Panoramica del tuo salone"
        action={
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm rounded-sm transition-all font-mono ${
                  period === p.value
                    ? 'bg-gold text-[#0a0a0a]'
                    : 'border border-dark-border text-cream/60 hover:text-gold hover:border-gold'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Appuntamenti"
          value={stats.totalAppointments}
          sub="nel periodo"
          accent="gold"
        />
        <StatCard
          label="Incassi"
          value={`€${parseFloat(stats.revenue || 0).toFixed(0)}`}
          sub="completati"
          accent="green"
        />
        <StatCard label="Oggi" value={stats.todayAppointments} sub="appuntamenti" accent="blue" />
        <StatCard label="Clienti" value={stats.totalClients} sub="registrati" accent="gold" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card md:col-span-2">
          <h3 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-6">
            Appuntamenti — Ultimi 7 giorni
          </h3>
          {dailyChart.length > 0 ? (
            <ColumnChart
              data={dailyChart}
              valueKey="appuntamenti"
              labelKey="date"
              barClass="bg-gold/70 hover:bg-gold/90"
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-cream/30 text-sm">
              Nessun dato disponibile
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-6">Per Stato</h3>
          {statusChart.length > 0 ? (
            <div className="min-h-[200px] flex flex-col justify-center">
              <HorizontalBars items={statusChart} />
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-cream/30 text-sm">
              Nessun dato
            </div>
          )}
        </div>
      </div>

      {dailyChart.length > 0 && (
        <div className="card">
          <h3 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-6">
            Incassi — Ultimi 7 giorni
          </h3>
          <ColumnChart
            data={dailyChart}
            valueKey="incassi"
            labelKey="date"
            barClass="bg-[#4caf78]/70 hover:bg-[#4caf78]/90"
          />
        </div>
      )}

      {stats.topBarbers?.length > 0 && (
        <div className="card mt-6">
          <h3 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-4">
            Top Barbieri
          </h3>
          <div className="space-y-3">
            {stats.topBarbers.map((b, i) => (
              <div key={b.barber_id} className="flex items-center gap-4">
                <span className="font-display text-2xl text-gold/40 w-6">{i + 1}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {b.barber?.user?.first_name} {b.barber?.user?.last_name}
                  </div>
                  <div className="h-1.5 bg-dark-border rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (parseInt(b.count, 10) / (stats.topBarbers[0]?.count || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-mono text-sm text-cream/60">{b.count} apt.</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
