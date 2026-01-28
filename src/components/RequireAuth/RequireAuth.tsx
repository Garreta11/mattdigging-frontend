import React from 'react';
import SignIn from '../SignIn/SignIn';
import { useAppContext } from '../../context/AppContext';

type Props = {
  children: React.ReactNode;
};

const RequireAuth = ({ children }: Props) => {
  const { isAuthed, loading } = useAppContext();

  if (loading) return <div>Loading...</div>; // or your loading component
  if (!isAuthed) return <SignIn />;
  
  return <>{children}</>;
};

export default RequireAuth;