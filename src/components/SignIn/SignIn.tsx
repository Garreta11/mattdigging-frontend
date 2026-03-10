import { supabase } from "../../lib/supabase";
import { useState } from "react";
import './SignIn.scss';

const BACKGROUND_IMAGE = '/chest/chest_00000.jpg';

type Mode = 'login' | 'signup' | 'forgot';

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
};

const SignIn = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<FormState>({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setForm({ email: '', password: '', confirmPassword: '' });
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
    if (form.password !== form.confirmPassword) {
      throw new Error("Passwords don't match.");
    }
    if (form.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) throw error;
    setSuccess('Check your email to confirm your account, then log in.');
    setForm({ email: '', password: '', confirmPassword: '' });
    setTimeout(() => switchMode('login'), 4000);
  };

  // ── Forgot Password ──────────────────────────────────────
  const handleForgot = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
    setSuccess("We've sent a reset link to your email.");
    setForm({ email: '', password: '', confirmPassword: '' });
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

  return (
    <div className="signin" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <div className="signin__overlay" />

      <div className="signin__card">

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
            <div className={`signin__toggle__indicator ${mode === 'signup' ? 'signin__toggle__indicator--right' : ''}`} />
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
          <div className="signin__form__fields">

            <div className="signin__form__field">
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

            {!isForgot && (
              <div className="signin__form__field signin__form__field--animate">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  value={form.password}
                  onChange={update('password')}
                  disabled={loading}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            {mode === 'signup' && (
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