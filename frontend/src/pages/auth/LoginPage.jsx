import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Compila tutti i campi');
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Benvenuto, ${data.user.first_name}!`);
      const role = data.user.role;
      if (role === 'ADMIN')  return navigate('/admin');
      if (role === 'BARBER') return navigate('/barber/calendar');
      navigate('/book');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Errore di accesso');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl tracking-[3px] mb-3">ACCEDI</h1>
          <p className="text-cream/50 text-sm">Il tuo appuntamento ti aspetta</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="nome@esempio.it"
              value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={set('password')} />
          </div>
          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Accesso in corso...' : 'Accedi →'}
          </button>
        </form>

        <p className="text-center text-cream/50 text-sm mt-6">
          Non hai un account?{' '}
          <Link to="/register" className="text-gold hover:underline">Registrati</Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-8 card bg-[#0d0d0d]">
          <p className="label mb-3">Credenziali demo</p>
          <div className="space-y-2 text-xs font-mono text-cream/50">
            <div className="flex justify-between">
              <span className="text-gold">ADMIN</span>
              <span>admin@barberos.it / Password123!</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">BARBIERE</span>
              <span>marco@barberos.it / Password123!</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400">CLIENTE</span>
              <span>giovanni@test.it / Password123!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
