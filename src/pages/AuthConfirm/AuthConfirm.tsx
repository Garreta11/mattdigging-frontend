import React, { useEffect } from 'react';

const AuthConfirm = () => {
  useEffect(() => {
    // Optional: after a short delay, send users back to Join
    const timer = setTimeout(() => {
      window.location.replace('/join');
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


