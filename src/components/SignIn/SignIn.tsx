import { supabase } from "../../lib/supabase";
import { useState } from "react";
import './SignIn.scss';

const BACKGROUND_IMAGE = '/chest/chest_00000.jpg';

const SignIn = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}>
      <div className="signin__overlay" />

      <form className="signin__form" onSubmit={handleSubmit}>
        <h2>Login to Matt Digging's World</h2>

        <div className="signin__form__inputs">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {error && <p className="signin__form__error">{error}</p>}

        <button className="signin__form__button" type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>
    </div>
  );
};

export default SignIn;