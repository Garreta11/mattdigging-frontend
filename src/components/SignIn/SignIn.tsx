import { supabase } from "../../lib/supabase";
import { useState } from "react";
import './SignIn.scss';
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

type Mode = 'login' | 'signup' | 'forgot';

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
    setSuccess('Check your email to confirm your account, then log in.');
    setForm(EMPTY_FORM);
    setTimeout(() => switchMode('login'), 4000);
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

  return (
    <div className="signin">
      <div className="signin__overlay" />

      <div className={`signin__card ${isSignup ? 'signin__card--wide' : ''}`}>

        <button className="signin__close" onClick={() => { navigate('/'); setTimeout(() => setIsSearchModalOpen(false), 300);}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Mode toggle — hidden on forgot screen */}
        {!isForgot && (
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
      </div>
    </div>
  );
};

export default SignIn;