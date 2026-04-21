import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage     from './pages/LandingPage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import CreatePage      from './pages/CreatePage';
import ShareCenterPage from './pages/ShareCenterPage';
import ReconstructPage from './pages/ReconstructPage';
import AboutPage       from './pages/AboutPage';
import ProfilePage     from './pages/ProfilePage';
import Navbar          from './components/Navbar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"            element={<LandingPage />} />
        <Route path="/about"       element={<AboutPage />} />
        <Route path="/login"       element={!user ? <LoginPage />    : <Navigate to="/dashboard" />} />
        <Route path="/register"    element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route path="/profile"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/create"      element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
        <Route path="/project/:id" element={<ProtectedRoute><ShareCenterPage /></ProtectedRoute>} />
        <Route path="/reconstruct" element={<ProtectedRoute><ReconstructPage /></ProtectedRoute>} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0f1628', color: '#F9FAFB', border: '1px solid rgba(148,163,184,0.12)', fontSize: '0.875rem' },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
