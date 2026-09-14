// frontend/src/pages/auth/AuthPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../../utils/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TABS = { login: 'login', register: 'register', forgot: 'forgot' };

// Map Firebase auth error codes to friendly messages
function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with a different sign-in method for this email.';
    case 'auth/cancelled-popup-request':
      return ''; // silent — user opened another popup
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const [searchParams] = useSearchParams();

  const isRegister = location.pathname === '/register';
  const [tab, setTab] = useState(isRegister ? TABS.register : TABS.login);

  const [form,        setForm]        = useState({ name: '', email: '', password: '' });
  const [showPw,      setShowPw]      = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [errors,    setErrors]    = useState({});
  const [resetSent, setResetSent] = useState(false);

  const from = location.state?.from?.pathname || '/';

  // If already logged in when visiting /login, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    }
  // Only re-run when loading resolves (not on every user change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Show query-param toasts — searchParams must be in deps to avoid stale closure
  useEffect(() => {
    if (searchParams.get('session') === 'expired') toast.error('Session expired. Please log in again.');
  }, [searchParams]);

  const setF = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (tab === TABS.register && !form.name.trim())          e.name     = 'Name is required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))    e.email    = 'Valid email required';
    if (tab !== TABS.forgot && form.password.length < 6)     e.password = 'Minimum 6 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Email / Password ──────────────────────────────────────────
  const handleEmailAuth = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (tab === TABS.login) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        toast.success('Welcome back! 💎');
        // Navigate immediately — don't wait for onAuthStateChanged
        navigate(from, { replace: true });
      } else if (tab === TABS.register) {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        await cred.user.getIdToken(true);
        toast.success('Account created! Welcome to Crafty Closet 💎');
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = friendlyError(err.code);
      if (msg) toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setErrors({ email: 'Valid email required' });
      return;
    }
    setPwLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      setResetSent(true);
    } catch (err) {
      toast.error(friendlyError(err.code));
    } finally {
      setPwLoading(false);
    }
  };

  // ── Social Sign-In (popup) ────────────────────────────────────
  const handleSocialLogin = async (provider, label) => {
    setSubmitting(true);
    try {
      await signInWithPopup(auth, provider);
      toast.success(`Signed in with ${label} 💎`);
      // Navigate immediately — don't wait for onAuthStateChanged
      navigate(from, { replace: true });
    } catch (err) {
      const msg = friendlyError(err.code);
      if (msg) toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (tab === TABS.forgot) return handleForgotPassword();
    handleEmailAuth();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-rose-50 to-sand">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-bold text-rose-700 mb-1">💎 Crafty Closet</div>
          <p className="text-rose-400 text-sm">Your style, your story</p>
        </div>

        <div className="card p-8 shadow-rose-md">

          {/* Tabs */}
          {tab !== TABS.forgot && (
            <div className="flex border border-rose-200 rounded-xl p-1 mb-7 bg-rose-50">
              {[TABS.login, TABS.register].map(t => (
                <button key={t} onClick={() => { setTab(t); setErrors({}); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab === t ? 'bg-white text-rose-700 shadow-rose-sm' : 'text-rose-400 hover:text-rose-600'
                  }`}
                >
                  {t === TABS.login ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          {/* Reset sent confirmation */}
          {tab === TABS.forgot && resetSent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="font-display text-xl font-bold text-rose-900 mb-2">Check your inbox</h3>
              <p className="text-rose-500 text-sm mb-6">
                We've sent a password reset link to <strong>{form.email}</strong>
              </p>
              <button onClick={() => { setTab(TABS.login); setResetSent(false); }} className="btn-primary">
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Form fields */}
              <div className="space-y-4">
                {tab === TABS.forgot && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-rose-900 mb-1">Forgot Password?</h3>
                    <p className="text-rose-400 text-sm mb-4">Enter your email and we'll send a reset link.</p>
                  </div>
                )}

                {tab === TABS.register && (
                  <div>
                    <label className="form-label">Full Name</label>
                    <input className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                      id="auth-name"
                      placeholder="Priya Sharma" value={form.name} onChange={setF('name')} />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                  </div>
                )}

                <div>
                  <label className="form-label">Email Address</label>
                  <input type="email" autoComplete="email"
                    id="auth-email"
                    className={`form-input ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="you@email.com" value={form.email} onChange={setF('email')} />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                {tab !== TABS.forgot && (
                  <div>
                    <label className="form-label">Password</label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPw ? 'text' : 'password'}
                        autoComplete={tab === TABS.login ? 'current-password' : 'new-password'}
                        className={`form-input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                        placeholder="••••••••" value={form.password} onChange={setF('password')}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300 hover:text-rose-500">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="form-error">{errors.password}</p>}
                  </div>
                )}
              </div>

              {/* Forgot password link */}
              {tab === TABS.login && (
                <div className="text-right mt-2">
                  <button onClick={() => { setTab(TABS.forgot); setErrors({}); }}
                    className="text-xs text-rose-400 hover:text-rose-600 transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                id="auth-submit"
                onClick={handleSubmit}
                disabled={submitting || pwLoading}
                className="btn-primary w-full mt-5"
              >
                {submitting || pwLoading ? 'Please wait…'
                  : tab === TABS.login    ? 'Sign In'
                  : tab === TABS.register ? 'Create Account'
                  : 'Send Reset Link'}
              </button>

              {/* Back link for forgot */}
              {tab === TABS.forgot && (
                <button onClick={() => { setTab(TABS.login); setErrors({}); }}
                  className="btn-ghost w-full mt-2 justify-center text-sm">
                  ← Back to Sign In
                </button>
              )}

              {/* Social sign-in — only on login / register tabs */}
              {tab !== TABS.forgot && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-rose-100" />
                    <span className="text-xs text-rose-300 font-medium">or continue with</span>
                    <div className="flex-1 h-px bg-rose-100" />
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Google */}
                    <button
                      id="auth-google"
                      onClick={() => handleSocialLogin(googleProvider, 'Google')}
                      disabled={submitting}
                      className="btn-google"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                        <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                      </svg>
                      Continue with Google
                    </button>

                    {/* GitHub */}
                    <button
                      id="auth-github"
                      onClick={() => handleSocialLogin(githubProvider, 'GitHub')}
                      disabled={submitting}
                      className="btn-github"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                      </svg>
                      Continue with GitHub
                    </button>
                  </div>
                </>
              )}

              {/* Demo hint */}
              {tab === TABS.login && (
                <p className="text-center text-xs text-rose-300 mt-4">
                
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
