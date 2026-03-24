import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      return toast.error('Compila tutti i campi obbligatori');
    }
    if (form.password.length < 8) return toast.error('Password di almeno 8 caratteri');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Registrazione completata!');
      navigate('/book');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore di registrazione');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl tracking-[3px] mb-3">REGISTRATI</h1>
          <p className="text-cream/50 text-sm">Crea il tuo account in 30 secondi</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input" placeholder="Mario" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div>
              <label className="label">Cognome *</label>
              <input className="input" placeholder="Rossi" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" placeholder="mario@esempio.it"
              value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input className="input" type="tel" placeholder="+39 333 1234567"
              value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label">Password *</label>
            <input className="input" type="password" placeholder="Min. 8 caratteri"
              value={form.password} onChange={set('password')} />
          </div>
          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creazione account...' : 'Crea Account →'}
          </button>
        </form>

        <p className="text-center text-cream/50 text-sm mt-6">
          Hai già un account?{' '}
          <Link to="/login" className="text-gold hover:underline">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
