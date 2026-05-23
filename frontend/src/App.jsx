import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import VerifyEmailPage from './pages/VerifyEmail';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function AuthRedirect({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-shell"><div className="loading-panel">Caricamento sessione...</div></div>;
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
      <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
      <Route path="/forgot" element={<AuthRedirect><ForgotPasswordPage /></AuthRedirect>} />
      <Route path="/reset" element={<AuthRedirect><ResetPasswordPage /></AuthRedirect>} />
      <Route path="/verify-email" element={<AuthRedirect><VerifyEmailPage /></AuthRedirect>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
