import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import { PageHeader, Modal, ConfirmDialog, Spinner, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

const EMPTY = {
  first_name: '', last_name: '', email: '', phone: '',
  password: '', bio: '', slot_duration: 30, color_hex: '#c9a84c',
};

const COLORS = ['#c9a84c','#4caf78','#5c8fe0','#e05c5c','#b478dc','#e8c97a'];

export default function AdminBarbers() {
  const [barbers,  setBarbers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await adminAPI.getUsers({ role: 'BARBER', limit: 100 });
      setBarbers(data.data);
    } catch { toast.error('Errore caricamento'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function openCreate() { setForm(EMPTY); setEditId(null); setModal(true); }

  async function handleSave() {
    if (!form.first_name || !form.last_name || !form.email) {
      return toast.error('Compila i campi obbligatori');
    }
    setSaving(true);
    try {
      if (editId) {
        await adminAPI.updateBarber(editId, form);
        toast.success('Barbiere aggiornato');
      } else {
        if (!form.password) return toast.error('Password obbligatoria');
        await adminAPI.createBarber(form);
        toast.success('Barbiere creato');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;

  return (
    <div className="p-8">
      <PageHeader
        title="BARBIERI"
        subtitle={`${barbers.length} membri dello staff`}
        action={<button className="btn-primary" onClick={openCreate}>+ Aggiungi Barbiere</button>}
      />

      {barbers.length === 0 ? (
        <EmptyState icon="✂️" title="Nessun barbiere" subtitle="Aggiungi il tuo primo membro dello staff"
          action={<button className="btn-primary" onClick={openCreate}>+ Aggiungi</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {barbers.map(b => (
            <div key={b.id} className="card flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: `${b.barberProfile?.color_hex || '#c9a84c'}20`,
                         border: `2px solid ${b.barberProfile?.color_hex || '#c9a84c'}` }}>
                ✂️
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{b.first_name} {b.last_name}</h3>
                <p className="text-cream/50 text-sm truncate">{b.email}</p>
                <p className="text-cream/30 text-xs mt-1">{b.phone || '—'}</p>
                <span className={`badge mt-2 ${b.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>
                  {b.is_active ? 'Attivo' : 'Disattivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editId ? 'Modifica Barbiere' : 'Nuovo Barbiere'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div>
              <label className="label">Cognome *</label>
              <input className="input" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input className="input" type="tel" value={form.phone} onChange={set('phone')} />
          </div>
          {!editId && (
            <div>
              <label className="label">Password *</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} />
            </div>
          )}
          <div>
            <label className="label">Bio</label>
            <textarea className="input resize-none" rows={2} value={form.bio} onChange={set('bio')} />
          </div>
          <div>
            <label className="label">Durata slot (minuti)</label>
            <select className="input" value={form.slot_duration}
              onChange={e => setForm(f => ({ ...f, slot_duration: parseInt(e.target.value) }))}>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
          <div>
            <label className="label">Colore Calendario</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color_hex: c }))}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{ background: c, outline: form.color_hex === c ? `2px solid ${c}` : 'none',
                           outlineOffset: 3 }} />
              ))}
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
    </div>
  );
}
