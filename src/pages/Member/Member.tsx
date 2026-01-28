import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Member.scss';

const Member = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setEmail(data.user?.email ?? '');
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/join', { replace: true });
  }

  return (
    <div className="member main-content">
      <h1>Member</h1>
      <p>logged in{email ? ` as ${email}` : ''}</p>
      <button className="member__button" onClick={handleLogout}>log out</button>
    </div>
  );
};

export default Member;


