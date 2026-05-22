import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="dashboard-card" style={{ width: 'min(960px, 100%)' }}>
          <div className="skeleton card" />
          <div style={{ height: 16 }} />
          <div className="skeleton line" />
          <div style={{ height: 10 }} />
          <div className="skeleton line" style={{ width: '78%' }} />
          <div style={{ height: 10 }} />
          <div className="skeleton line" style={{ width: '62%' }} />
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
