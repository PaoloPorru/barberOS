import { useState, useEffect, useCallback } from 'react';
import { adminAPI, servicesAPI } from '../../api';
import { PageHeader, Modal, ConfirmDialog, Spinner, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', price: '', duration_minutes: 30 };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await servicesAPI.getAll();
      setServices(data.data);
    } catch { toast.error('Errore caricamento'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function openCreate() { setForm(EMPTY); setEditId(null); setModal(true); }
  function openEdit(s) {
    setForm({ name: s.name, description: s.description || '', price: s.price, duration_minutes: s.duration_minutes });
    setEditId(s.id);
    setModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.duration_minutes) return toast.error('Compila tutti i campi');
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), duration_minutes: parseInt(form.duration_minutes) };
      editId ? await adminAPI.updateService(editId, payload) : await adminAPI.createService(payload);
      toast.success(editId ? 'Servizio aggiornato' : 'Servizio creato');
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Errore'); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminAPI.deleteService(deleteId);
      toast.success('Servizio disattivato');
      setDeleteId(null);
      load();
    } catch { toast.error('Errore'); }
    finally { setDeleting(false); }
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;

  return (
    <div className="p-8">
      <PageHeader
        title="SERVIZI"
        subtitle={`${services.length} servizi attivi`}
        action={<button className="btn-primary" onClick={openCreate}>+ Aggiungi Servizio</button>}
      />

      {services.length === 0 ? (
        <EmptyState icon="💈" title="Nessun servizio" subtitle="Aggiungi i servizi della tua barberia"
          action={<button className="btn-primary" onClick={openCreate}>+ Aggiungi</button>} />
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 px-6 py-2">
            <span className="col-span-4 label">Servizio</span>
            <span className="col-span-3 label">Durata</span>
            <span className="col-span-2 label">Prezzo</span>
            <span className="col-span-3 label"></span>
          </div>
          {services.map(s => (
            <div key={s.id} className="card grid grid-cols-12 items-center">
              <div className="col-span-4">
                <p className="font-medium text-cream">{s.name}</p>
                {s.description && <p className="text-cream/40 text-xs mt-0.5 line-clamp-1">{s.description}</p>}
              </div>
              <div className="col-span-3">
                <span className="font-mono text-sm text-cream/70">⏱ {s.duration_minutes} min</span>
              </div>
              <div className="col-span-2">
                <span className="font-display text-xl text-gold">€{parseFloat(s.price).toFixed(0)}</span>
              </div>
              <div className="col-span-3 flex gap-2 justify-end">
                <button className="btn-ghost px-3 py-2 text-xs" onClick={() => openEdit(s)}>Modifica</button>
                <button className="btn-danger px-3 py-2 text-xs" onClick={() => setDeleteId(s.id)}>Rimuovi</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Modifica Servizio' : 'Nuovo Servizio'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" placeholder="es. Taglio Classico" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label">Descrizione</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prezzo (€) *</label>
              <input className="input" type="number" min="0" step="0.5" value={form.price} onChange={set('price')} />
            </div>
            <div>
              <label className="label">Durata (min) *</label>
              <select className="input" value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))}>
                {[15,20,30,45,60,75,90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setModal(false)}>Annulla</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        loading={deleting} title="Rimuovi Servizio"
        message="Il servizio verrà disattivato. Gli appuntamenti esistenti non saranno modificati." />
    </div>
  );
}
