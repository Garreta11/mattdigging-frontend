import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import Lenis from '@studio-freight/lenis';

// Pages
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Artists from './pages/Artists/Artists';
import Playlists from './pages/Playlists/Playlists';
import Selections from './pages/Selections/Selections';
import AuthConfirm from './pages/AuthConfirm/AuthConfirm';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Admin from './pages/Admin/Admin';
import RequireAuth from './components/RequireAuth/RequireAuth';
import HiddenGems from './pages/HiddenGems/HiddenGems';
import Terms from './pages/Terms/Terms';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';

// Components
import Player from './components/Player/Player';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import MainWrapper from './components/MainWrapper/MainWrapper';
import Modals from './components/Modals/Modals';

// Utils
import { AppProvider } from './context/AppContext';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

export let lenis: Lenis;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function App() {
  const location = useLocation();
  const isTermsPage = location.pathname === '/terms';

  useEffect(() => {
    if (location.pathname === '/admin') return;

    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public route for email confirmation */}
      <Route path="/auth/confirm" element={<AuthConfirm />} />

      {/* Public route for password reset */}
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<Terms />} />

      {/* Admin route - separate layout */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Admin />
          </RequireAuth>
        }
      />

      {/* Login route - separate layout */}
      {/* <Route
        path="/login"
        element={
          <RequireAuth>
            <Login />
          </RequireAuth>
        }
      /> */}

      {/* All other routes with main layout */}
      <Route
        path="*"
        element={
          <RequireAuth>
            <Header />
            <main className="main">
              {!isTermsPage && (
                <MainWrapper>
                  <Home />
                </MainWrapper>
              )}

              {!isTermsPage && <Player />}
              {!isTermsPage && <Modals />}

              <Routes>
                <Route path="/" element={<></>} />
                <Route path="/hidden-gems" element={<HiddenGems />} />
                <Route path="/about" element={<About />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/selections" element={<Selections />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </main>

            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
            
            <Footer />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

root.render(
  <React.StrictMode>
    <AppProvider>
      <Router>
        <App />
      </Router>
    </AppProvider>
  </React.StrictMode>
);

reportWebVitals();