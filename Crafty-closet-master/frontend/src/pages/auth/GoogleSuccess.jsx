// frontend/src/pages/auth/GoogleSuccess.jsx
// This page receives the token from the backend Google OAuth callback redirect
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function GoogleSuccess() {
  const [searchParams] = useSearchParams();
  const { saveAuth }   = useAuth();
  const navigate       = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const name  = searchParams.get('name');
    const role  = searchParams.get('role');

    if (!token) {
      toast.error('Google sign-in failed');
      navigate('/login');
      return;
    }

    // Save token & fetch full user profile
    localStorage.setItem('cc_token', token);
    authAPI.me()
      .then(r => {
        saveAuth(token, r.data.user);
        toast.success(`Welcome, ${r.data.user.name}! 💎`);
        navigate(role === 'admin' ? '/admin' : '/', { replace: true });
      })
      .catch(() => {
        toast.error('Authentication failed');
        navigate('/login');
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-cream">
      <Spinner size="lg" />
      <p className="text-rose-500 text-sm font-medium">Signing you in with Google…</p>
    </div>
  );
}
