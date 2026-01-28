import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';

// Pages
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Artists from './pages/Artists/Artists';
import Join from './pages/Join/Join';
import Playlists from './pages/Playlists/Playlists';
import Search from './pages/Search/Search';
import Selections from './pages/Selections/Selections';
import Play from './pages/Play/Play';
import AuthConfirm from './pages/AuthConfirm/AuthConfirm';
import Member from './pages/Member/Member';
import Admin from './pages/Admin/Admin';
import RequireAuth from './components/RequireAuth/RequireAuth';

// Components
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

// Utils
import { AppProvider } from './context/AppContext';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppProvider>
      <Router>
        <Routes>
          {/* Public route for email confirmation */}
          <Route path="/auth/confirm" element={<AuthConfirm />} />

          {/* Admin route - separate layout without Home background */}
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
                  <Home />
                  <Routes>
                    <Route path="/" element={<></>} />
                    <Route path="/about" element={<About />} />
                    <Route path="/artists" element={<Artists />} />
                    <Route path="/join" element={<Join />} />
                    <Route path="/playlists" element={<Playlists />} />
                    <Route path="/search" element={<Search />} />
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
  </React.StrictMode>
);

reportWebVitals();
