import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { PageHeader, StatCard, Spinner } from '../../components/ui';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const PERIODS = [
  { value: 'day',   label: 'Oggi' },
  { value: 'week',  label: 'Settimana' },
  { value: 'month', label: 'Mese' },
];

const tooltipStyle = {
  contentStyle: { background: '#181818', border: '1px solid #2a2a2a', borderRadius: '4px',
                  color: '#f5f0e8', fontFamily: '"DM Sans"', fontSize: 12 },
  labelStyle: { color: '#c9a84c' },
};

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [period,  setPeriod]  = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAPI.getStats(period)
      .then(r => setStats(r.data.data))
      .catch(() => toast.error('Errore caricamento statistiche'))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !stats) return (
    <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>
  );

  const dailyChart = (stats.dailyData || []).map(d => ({
    date:    format(new Date(d.date), 'd MMM', { locale: it }),
    appuntamenti: parseInt(d.count),
    incassi: parseFloat(d.revenue || 0),
  }));

  const statusChart = Object.entries(stats.byStatus || {}).map(([k, v]) => ({
    name: { CONFIRMED: 'Conf.', CANCELLED: 'Canc.', COMPLETED: 'Compl.', PENDING: 'Attesa' }[k] || k,
    value: v,
    color: { CONFIRMED: '#4caf78', CANCELLED: '#e05c5c', COMPLETED: '#5c8fe0', PENDING: '#e8c97a' }[k] || '#888',
  }));

  return (
    <div className="p-8">
      <PageHeader
        title="DASHBOARD"
        subtitle="Panoramica del tuo salone"
        action={
          <div className="flex gap-2">
            {PERIODS.map(p => (
              <button key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm rounded-sm transition-all font-mono ${
                  period === p.value
                    ? 'bg-gold text-[#0a0a0a]'
                    : 'border border-dark-border text-cream/60 hover:text-gold hover:border-gold'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPIs */}
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
        <StatCard
          label="Oggi"
          value={stats.todayAppointments}
          sub="appuntamenti"
          accent="blue"
        />
        <StatCard
          label="Clienti"
          value={stats.totalClients}
          sub="registrati"
          accent="gold"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Daily trend */}
        <div className="card md:col-span-2">
          <h3 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-6">
            Appuntamenti — Ultimi 7 giorni
          </h3>
          {dailyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyChart}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="appuntamenti"
                  stroke="#c9a84c" strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-cream/30 text-sm">
              Nessun dato disponibile
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card">
          <h3 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-6">
            Per Stato
          </h3>
          {statusChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {statusChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-cream/30 text-sm">
              Nessun dato
            </div>
          )}
        </div>
      </div>

      {/* Revenue chart */}
      {dailyChart.length > 0 && (
        <div className="card">
          <h3 className="font-mono text-xs tracking-[3px] text-cream/40 uppercase mb-6">
            Incassi — Ultimi 7 giorni
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={dailyChart}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4caf78" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4caf78" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={v => `€${v}`} />
              <Tooltip {...tooltipStyle} formatter={v => [`€${v}`, 'Incassi']} />
              <Area type="monotone" dataKey="incassi"
                stroke="#4caf78" strokeWidth={2} fill="url(#greenGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top barbers */}
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
                    <div className="h-full bg-gold rounded-full"
                      style={{ width: `${Math.min(100, (parseInt(b.count) / (stats.topBarbers[0]?.count || 1)) * 100)}%` }} />
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
