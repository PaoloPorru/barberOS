import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import { PageHeader, StatusBadge, Spinner, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '', page: 1 });
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 30 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await adminAPI.getAppointments(params);
      setAppointments(data.data);
      setTotal(data.pagination?.total || 0);
    } catch { toast.error('Errore caricamento'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value, page: 1 }));

  const totalRevenue = appointments
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + parseFloat(a.price_snapshot || 0), 0);

  return (
    <div className="p-8">
      <PageHeader
        title="PRENOTAZIONI"
        subtitle={`${total} totali · €${totalRevenue.toFixed(2)} incassati (filtro attuale)`}
      />

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">Stato</label>
          <select className="input w-40" value={filters.status} onChange={setFilter('status')}>
            <option value="">Tutti</option>
            <option value="CONFIRMED">Confermati</option>
            <option value="COMPLETED">Completati</option>
            <option value="CANCELLED">Cancellati</option>
            <option value="PENDING">In attesa</option>
          </select>
        </div>
        <div>
          <label className="label">Dal</label>
          <input type="date" className="input w-40" value={filters.date_from} onChange={setFilter('date_from')} />
        </div>
        <div>
          <label className="label">Al</label>
          <input type="date" className="input w-40" value={filters.date_to} onChange={setFilter('date_to')} />
        </div>
        <button className="btn-ghost px-4 py-3"
          onClick={() => setFilters({ status: '', date_from: '', date_to: '', page: 1 })}>
          Reset
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : appointments.length === 0 ? (
        <EmptyState icon="📋" title="Nessuna prenotazione" subtitle="Prova a modificare i filtri" />
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-12 px-6 py-2">
            <span className="col-span-3 label">Cliente</span>
            <span className="col-span-2 label">Barbiere</span>
            <span className="col-span-2 label">Servizio</span>
            <span className="col-span-3 label">Data & Ora</span>
            <span className="col-span-1 label">Prezzo</span>
            <span className="col-span-1 label">Stato</span>
          </div>

          {appointments.map(apt => {
            const start = new Date(apt.start_datetime);
            return (
              <div key={apt.id} className="card grid grid-cols-12 items-center gap-2">
                <div className="col-span-3">
                  <p className="font-medium text-sm truncate">
                    {apt.client?.first_name} {apt.client?.last_name}
                  </p>
                  <p className="text-cream/40 text-xs truncate">{apt.client?.phone || apt.client?.email}</p>
                </div>
                <div className="col-span-2 text-sm text-cream/70 truncate">
                  {apt.barber?.user?.first_name} {apt.barber?.user?.last_name}
                </div>
                <div className="col-span-2 text-sm text-cream/70 truncate">{apt.service?.name}</div>
                <div className="col-span-3">
                  <p className="text-sm capitalize">
                    {format(start, 'd MMM yyyy', { locale: it })}
                  </p>
                  <p className="text-cream/40 text-xs">{format(start, 'HH:mm')}</p>
                </div>
                <div className="col-span-1">
                  <span className="font-display text-lg text-gold">€{parseFloat(apt.price_snapshot).toFixed(0)}</span>
                </div>
                <div className="col-span-1">
                  <StatusBadge status={apt.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 30 && (
        <div className="flex justify-center gap-3 mt-8">
          <button className="btn-ghost px-4 py-2" disabled={filters.page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prec.</button>
          <span className="flex items-center text-cream/50 text-sm font-mono">
            Pag. {filters.page} / {Math.ceil(total / 30)}
          </span>
          <button className="btn-ghost px-4 py-2" disabled={filters.page >= Math.ceil(total / 30)}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Succ. →</button>
        </div>
      )}
    </div>
  );
}
