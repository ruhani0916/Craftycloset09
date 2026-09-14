// frontend/src/components/layout/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-10 h-10 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading)  return <Loading />;
  if (!user)    return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user)    return <Navigate to="/" replace />;
  return children;
}
