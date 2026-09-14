// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../utils/firebase';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // DB user (contains role, id, etc.)
  const [user,    setUser]    = useState(null);
  // Raw Firebase user object
  const [fbUser,  setFbUser]  = useState(null);
  const [loading, setLoading] = useState(true);

  // ── onAuthStateChanged is the single source of truth ──────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFbUser(firebaseUser);

        // Build a fallback user from Firebase claims immediately
        // so navigation/UI works even before the backend responds
        const fallback = {
          email:  firebaseUser.email,
          name:   firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatar: firebaseUser.photoURL  || null,
          role:   'user', // safe default; overwritten by backend sync below
        };
        setUser(fallback);
        setLoading(false); // ← unblock UI right away

        try {
          // Force-refresh to ensure we send a fresh token to the backend
          await firebaseUser.getIdToken(true);
          const res = await authAPI.sync();
          // Only overwrite fallback if we got a real DB user back.
          if (res.data?.user?.id) {
            setUser(res.data.user);
          }
        } catch (err) {
          // GitHub users with no email → backend returns 400 + code: NO_EMAIL
          // Sign them out and surface a clear toast instead of leaving them in
          // a broken "logged in but all API calls fail" state.
          if (err.status === 400 && err.code === 'NO_EMAIL') {
            await signOut(auth);
            setUser(null);
            setFbUser(null);
            toast.error(
              'Your GitHub account has no email address. ' +
              'Please add and verify one in GitHub Settings → Emails, then try again.',
              { duration: 6000 }
            );
            return;
          }
          // Backend unreachable or sync failed — keep the fallback user.
          console.warn('[Auth] backend sync failed — using Firebase fallback:', err.message);
        }
      } else {
        // Signed out
        setFbUser(null);
        setUser(null);
        localStorage.removeItem('cc_token');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Force-refresh the stored ID token (called by axios interceptor if needed)
  const refreshToken = useCallback(async () => {
    if (!fbUser) return null;
    try {
      const idToken = await fbUser.getIdToken(true);
      localStorage.setItem('cc_token', idToken);
      return idToken;
    } catch {
      return null;
    }
  }, [fbUser]);

  const logout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem('cc_token');
    setUser(null);
    setFbUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      fbUser,
      loading,
      isAdmin:  user?.role === 'admin',
      logout,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
