import { supabase } from "../../lib/supabase";
import { useState } from "react";
import './SignIn.scss';
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

type Mode = 'login' | 'signup' | 'forgot' | 'sent';

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  username: string;
  termsAccepted: boolean;
};

const EMPTY_FORM: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  username: '',
  termsAccepted: false,
};

const SignIn = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const navigate = useNavigate();
  const { setIsSearchModalOpen } = useAppContext();

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setForm(EMPTY_FORM);
  };

  // ── Login ────────────────────────────────────────────────
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) throw error;
    window.location.href = '/';
  };

  // ── Sign Up ──────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!form.termsAccepted) {
      throw new Error('Please accept the Terms & Conditions to continue.');
    }
    if (form.password !== form.confirmPassword) {
      throw new Error("Passwords don't match.");
    }
    if (form.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.displayName,
          username: form.username,
        },
      },
    });
    if (error) throw error;
    setSentTo(form.email);
    switchMode('sent');
  };

  // ── Google OAuth ─────────────────────────────────────────
  const handleGoogle = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    // On success the browser navigates to Google, so only errors land here.
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // ── Forgot Password ──────────────────────────────────────
  const handleForgot = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
    setSuccess("We've sent a reset link to your email.");
    setForm(EMPTY_FORM);
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === 'login') await handleLogin();
      else if (mode === 'signup') await handleSignUp();
      else await handleForgot();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const isForgot = mode === 'forgot';
  const isSignup = mode === 'signup';
  const isSent = mode === 'sent';

  return (
    <div className="signin">
      <div className="signin__overlay" />

      <div className={`signin__card ${isSignup ? 'signin__card--wide' : ''}`}>

        <button className="signin__close" onClick={() => { navigate('/'); setTimeout(() => setIsSearchModalOpen(false), 300);}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Mode toggle — hidden on forgot / sent screens */}
        {!isForgot && !isSent && (
          <div className="signin__toggle">
            <button
              type="button"
              className={`signin__toggle__btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`signin__toggle__btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
            <div className={`signin__toggle__indicator ${isSignup ? 'signin__toggle__indicator--right' : ''}`} />
          </div>
        )}

        {isSent ? (
          <div className="signin__sent">
            <div className="signin__sent__icon" aria-hidden>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </div>
            <h2>Check your inbox</h2>
            <p>
              We sent a confirmation link to <strong>{sentTo}</strong>.
            </p>
            <p>
              Open that email and click the link to activate your account. Then come back here and log in.
            </p>
            <p className="signin__sent__hint">
              Nothing there? Check your spam or junk folder.
            </p>
            <button
              type="button"
              className="signin__form__button"
              onClick={() => switchMode('login')}
            >
              Back to login
            </button>
          </div>
        ) : (
        <>
        {/* Heading */}
        <div className="signin__heading">
          {isForgot && (
            <button
              type="button"
              className="signin__back"
              onClick={() => switchMode('login')}
              aria-label="Back to login"
            >
              ← Back
            </button>
          )}
          <h2>
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Join the world'}
            {mode === 'forgot' && 'Reset password'}
          </h2>
          <p>
            {mode === 'login' && "Matt Digging's curated universe awaits."}
            {mode === 'signup' && 'Create your account to access the music.'}
            {mode === 'forgot' && "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {/* Form */}
        <form className="signin__form" onSubmit={handleSubmit} noValidate>
          <div className={`signin__form__fields ${isSignup ? 'signin__form__fields--signup' : ''}`}>

            {/* Email — always full width */}
            <div className="signin__form__field signin__form__field--full">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update('email')}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>

            {/* Display Name — signup only */}
            {isSignup && (
              <div className="signin__form__field signin__form__field--animate">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={form.displayName}
                  onChange={update('displayName')}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            )}

            {/* Username — signup only */}
            {isSignup && (
              <div className="signin__form__field signin__form__field--animate">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="@yourhandle"
                  value={form.username}
                  onChange={update('username')}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            )}

            {/* Password — login and signup */}
            {!isForgot && (
              <div className="signin__form__field signin__form__field--animate">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
                  value={form.password}
                  onChange={update('password')}
                  disabled={loading}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            {/* Confirm Password — signup only */}
            {isSignup && (
              <div className="signin__form__field signin__form__field--animate">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* Terms — signup only, full width */}
            {isSignup && (
              <label className="signin__form__checkbox signin__form__field--animate signin__form__field--full">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, termsAccepted: e.target.checked }));
                    setError(null);
                  }}
                  disabled={loading}
                />
                <span>
                  I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    Terms &amp; Conditions
                  </a>
                </span>
              </label>
            )}
          </div>

          {/* Forgot password link — only on login */}
          {mode === 'login' && (
            <button
              type="button"
              className="signin__forgot-link"
              onClick={() => switchMode('forgot')}
            >
              Forgot password?
            </button>
          )}

          {/* Feedback */}
          {error && <p className="signin__feedback signin__feedback--error">{error}</p>}
          {success && <p className="signin__feedback signin__feedback--success">{success}</p>}

          <button
            className="signin__form__button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? isForgot ? 'Sending…' : mode === 'login' ? 'Logging in…' : 'Creating account…'
              : isForgot ? 'Send Reset Link' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        {/* Google OAuth — login and signup */}
        {!isForgot && (
          <>
            <div className="signin__divider"><span>or</span></div>
            <button
              type="button"
              className="signin__google"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>
            {isSignup && (
              <p className="signin__google__terms">
                By continuing with Google you agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>.
              </p>
            )}
          </>
        )}

        {/* Footer switch */}
        {!isForgot && (
          <p className="signin__switch">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="signin__switch__link"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default SignIn;
