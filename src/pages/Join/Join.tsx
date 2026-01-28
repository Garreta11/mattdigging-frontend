import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Join.scss';
import { supabase } from '../../lib/supabase';

const Join = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      setMessage('email and password are required');
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/member', { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        });
        if (error) throw error;
        setMessage('registration email sent');
      }
    } catch (err: any) {
      setMessage(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="join main-content">
      <h1>Join</h1>
      <div className="join__forms">
        <div className="join__form" style={{ gridColumn: '1 / -1' }}>
          <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={onSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
          <div>
            {mode === 'login' ? (
              <button onClick={() => setMode('register')} style={{ marginTop: 8 }}>
                not registered yet? register
              </button>
            ) : (
              <button onClick={() => setMode('login')} style={{ marginTop: 8 }}>
                already have an account? login
              </button>
            )}
          </div>
        </div>
      </div>
      {message && <p className="join__message">{message}</p>}
    </div>
  );
};

export default Join;