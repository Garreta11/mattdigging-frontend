import React, { useEffect, useState } from 'react';
import SignIn from '../SignIn/SignIn';
import { useAppContext } from '../../context/AppContext';
import Loader from '../Loader/Loader';

const MIN_LOADER_MS = 2000;
const FADE_DURATION_MS = 600;

type Props = {
  children: React.ReactNode;
};

const RequireAuth = ({ children }: Props) => {
  const { isAuthed, loading } = useAppContext();
  const [minElapsed, setMinElapsed] = useState(false);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && minElapsed && !fading && !gone) {
      setFading(true);
      const timer = setTimeout(() => setGone(true), FADE_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [loading, minElapsed, fading, gone]);

  return (
    <>
      {children}
      {!gone && <Loader fullscreen fading={fading} />}
    </>
  );
};

export default RequireAuth;
