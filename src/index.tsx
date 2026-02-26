import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import Lenis from '@studio-freight/lenis';

// Pages
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Artists from './pages/Artists/Artists';
import Join from './pages/Join/Join';
import Playlists from './pages/Playlists/Playlists';
import Selections from './pages/Selections/Selections';
import Play from './pages/Play/Play';
import AuthConfirm from './pages/AuthConfirm/AuthConfirm';
import Member from './pages/Member/Member';
import Admin from './pages/Admin/Admin';
import RequireAuth from './components/RequireAuth/RequireAuth';

// Components
import Player from './components/Player/Player';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import MainWrapper from './components/MainWrapper/MainWrapper';
import Modals from './components/Modals/Modals';

// Utils
import { AppProvider } from './context/AppContext';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

export let lenis: Lenis;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function App() {
  useEffect(() => {
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
  }, []);

  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public route for email confirmation */}
          <Route path="/auth/confirm" element={<AuthConfirm />} />

          {/* Admin route - separate layout */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Admin />
              </RequireAuth>
            }
          />

          {/* All other routes with main layout */}
          <Route
            path="*"
            element={
              <RequireAuth>
                <Header />
                <main className="main">
                  <MainWrapper>
                    <Home />
                  </MainWrapper>

                  <Player />
                  <Modals />

                  <Routes>
                    <Route path="/" element={<></>} />
                    <Route path="/about" element={<About />} />
                    <Route path="/artists" element={<Artists />} />
                    <Route path="/join" element={<Join />} />
                    <Route path="/playlists" element={<Playlists />} />
                    <Route path="/selections" element={<Selections />} />
                    <Route path="/play" element={<Play />} />
                    <Route path="/member" element={<Member />} />
                  </Routes>
                </main>
                <Footer />
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();