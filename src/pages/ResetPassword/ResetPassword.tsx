import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './ResetPassword.scss';

const BACKGROUND_IMAGE = '/chest/chest_00000.jpg';

type Step = 'form' | 'success' | 'invalid';

const ResetPassword = () => {
  const [step, setStep] = useState<Step>('form');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Supabase sends the user here with a session already set in the URL hash.
  // We just need to verify a session exists — if not, the link is invalid/expired.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setStep('invalid');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <div className="reset-password__overlay" />

      <div className="reset-password__card">

        {/* ── Invalid / expired link ── */}
        {step === 'invalid' && (
          <div className="reset-password__state">
            <div className="reset-password__state__icon reset-password__state__icon--error">✕</div>
            <h2>Link expired</h2>
            <p>This reset link is invalid or has already been used.</p>
            <a href="/signin" className="reset-password__state__btn">
              Back to Login
            </a>
          </div>
        )}

        {/* ── Success ── */}
        {step === 'success' && (
          <div className="reset-password__state">
            <div className="reset-password__state__icon reset-password__state__icon--success">✓</div>
            <h2>Password updated</h2>
            <p>Your password has been changed successfully.</p>
            <a href="/" className="reset-password__state__btn">
              Go to the app
            </a>
          </div>
        )}

        {/* ── Form ── */}
        {step === 'form' && (
          <>
            <div className="reset-password__heading">
              <h2>Choose a new password</h2>
              <p>Pick something strong you'll remember.</p>
            </div>

            <form className="reset-password__form" onSubmit={handleSubmit} noValidate>
              <div className="reset-password__form__fields">
                <div className="reset-password__form__field">
                  <label htmlFor="password">New Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="reset-password__form__field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {error && (
                <p className="reset-password__feedback reset-password__feedback--error">{error}</p>
              )}

              <button
                className="reset-password__form__button"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default ResetPassword;