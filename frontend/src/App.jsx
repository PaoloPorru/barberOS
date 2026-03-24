import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import PublicLayout from './components/layouts/PublicLayout';
import AppLayout    from './components/layouts/AppLayout';

// Auth pages
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Client pages
import BookingPage      from './pages/client/BookingPage';
import MyAppointments   from './pages/client/MyAppointments';

// Barber pages
import BarberCalendar   from './pages/barber/BarberCalendar';
import BarberAvailability from './pages/barber/BarberAvailability';

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminBarbers     from './pages/admin/AdminBarbers';
import AdminServices    from './pages/admin/AdminServices';
import AdminAppointments from './pages/admin/AdminAppointments';

// Misc
import HomePage   from './pages/HomePage';
import NotFound   from './pages/NotFound';

// Route guards
function RequireAuth({ children, roles }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
      </Route>

      {/* Client */}
      <Route element={<AppLayout />}>
        <Route path="/book" element={
          <RequireAuth roles={['CLIENT','ADMIN']}>
            <BookingPage />
          </RequireAuth>
        } />
        <Route path="/appointments" element={
          <RequireAuth roles={['CLIENT','ADMIN']}>
            <MyAppointments />
          </RequireAuth>
        } />

        {/* Barber */}
        <Route path="/barber/calendar" element={
          <RequireAuth roles={['BARBER','ADMIN']}>
            <BarberCalendar />
          </RequireAuth>
        } />
        <Route path="/barber/availability" element={
          <RequireAuth roles={['BARBER','ADMIN']}>
            <BarberAvailability />
          </RequireAuth>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <RequireAuth roles={['ADMIN']}>
            <AdminDashboard />
          </RequireAuth>
        } />
        <Route path="/admin/barbers" element={
          <RequireAuth roles={['ADMIN']}>
            <AdminBarbers />
          </RequireAuth>
        } />
        <Route path="/admin/services" element={
          <RequireAuth roles={['ADMIN']}>
            <AdminServices />
          </RequireAuth>
        } />
        <Route path="/admin/appointments" element={
          <RequireAuth roles={['ADMIN']}>
            <AdminAppointments />
          </RequireAuth>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
