import React, { useEffect } from 'react';

const AuthConfirm = () => {
  useEffect(() => {
    // After a short delay, send users to login
    const timer = setTimeout(() => {
      window.location.replace('/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="main-content" style={{ padding: '40px 24px' }}>
      <h1>You're confirmed</h1>
      <p>Thanks! You can now log in.</p>
    </div>
  );
};

export default AuthConfirm;


