import { supabase } from "../../lib/supabase";
import { useState } from "react";
import './SignIn.scss';

const backgroundImage = '/room.png';

const SignIn = () => {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const signInWithEmail = async () => {
    await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });
    window.location.href = "/";
  };

  return (
    <div className="signin" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <h2>Login to Matt Digging's World</h2>
      <input type="email" placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
      <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
      <button onClick={signInWithEmail}>Login</button>
    </div>
  );
};

export default SignIn;
