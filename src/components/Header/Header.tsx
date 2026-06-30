import React, { useState, useEffect, useRef } from 'react';
import './Header.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import SearchInput from '../SearchInput/SearchInput';
import UserInfo from '../UserInfo/UserInfo';
import ContactDialog from '../ContactDialog/ContactDialog';

const Header = () => {
  const { user, isAuthed, isFullscreen, setIsFullscreen, setIsMobileMenuOpen } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (location.pathname === path) {
      closeSidebar();
      return;
    }

    e.preventDefault();
    closeSidebar();

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('fade-out');
      setTimeout(() => {
        navigate(path);
        setTimeout(() => {
          mainContent.classList.remove('fade-out');
          mainContent.classList.add('fade-in');
          setTimeout(() => {
            mainContent.classList.remove('fade-in');
          }, 300);
        }, 50);
      }, 1000);
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    closeSidebar();
  }, [location]);

  useEffect(() => {
    setIsMobileMenuOpen(isOpen);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, setIsMobileMenuOpen]);

  const handleLogout = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sb-'))
      .forEach((key) => localStorage.removeItem(key));
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    navigate('/');
    window.location.reload();
  };

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
        <ContactDialog
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          defaultEmail={user?.email ?? ''}
        />
        <header className={`header ${isFullscreen ? 'header--fullscreen' : ''}`}>
          {/* Logo */}
          <div className="header__logo">
            <Link
              className="header__link"
              to="/"
              onClick={(e) => {
                e.preventDefault();
                setIsFullscreen(false);
                handleNavigate(e, '/');
              }}
            >
              <img className="header__logo__image" src="/svg/logo-color.svg" alt="Matt Digging" />
            </Link>
          </div>

          {/* SearchInput Component */}
          <SearchInput />

          {/* Desktop Navigation */}
          <nav className={`header__links header__links--desktop ${isFullscreen ? 'header__links--fullscreen' : ''}`}>
            <div className={`header__links__item ${isActive('/artists') ? 'selected' : ''}`}>
              <Link to="/artists" onClick={(e) => handleNavigate(e, '/artists')}>Artists</Link>
            </div>
            <div className={`header__links__item ${isActive('/selections') ? 'selected' : ''}`}>
              <Link to="/selections" onClick={(e) => handleNavigate(e, '/selections')}>Weekly Selections</Link>
            </div>
            <div className={`header__links__item ${isActive('/about') ? 'selected' : ''}`}>
              <Link to="/about" onClick={(e) => handleNavigate(e, '/about')}>About</Link>
            </div>

            {isAuthed ? (
            <div className="header__links__items header__links__user" ref={dropdownRef}>
              <UserInfo onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} />
              {isUserDropdownOpen && (
                <div className="header__links__user__dropdown">
                  <span className="header__links__user__dropdown__label">Account</span>

                  <Link
                    to="/profile"
                    className="header__links__user__dropdown__item"
                    onClick={(e) => { handleNavigate(e, '/profile'); setIsUserDropdownOpen(false); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    Profile
                  </Link>

                  <Link
                    to="/terms"
                    className="header__links__user__dropdown__item"
                    onClick={(e) => { handleNavigate(e, '/terms'); setIsUserDropdownOpen(false); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
                    </svg>
                    Terms & Conditions
                    <svg className="header__links__user__dropdown__item__external" width="9" height="9" viewBox="0 0 16 16" fill="none">
                      <path d="M15.707 0.999999C15.707 0.447715 15.2593 -2.87362e-07 14.707 -5.40243e-07L5.70703 2.60547e-07C5.15475 -7.66277e-08 4.70703 0.447715 4.70703 1C4.70703 1.55228 5.15475 2 5.70703 2L13.707 2L13.707 10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10L15.707 0.999999ZM0.707031 15L1.41414 15.7071L15.4141 1.70711L14.707 1L13.9999 0.292893L-7.55191e-05 14.2929L0.707031 15Z" fill="currentColor" />
                    </svg>
                  </Link>

                  <button
                    className="header__links__user__dropdown__item"
                    onClick={() => { setIsContactOpen(true); setIsUserDropdownOpen(false); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                    </svg>
                    Any Questions / Feedback?
                  </button>

                  <div className="header__links__user__dropdown__divider" />

                  <button
                    className="header__links__user__dropdown__item--logout"
                    onClick={() => { handleLogout(); setIsUserDropdownOpen(false); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
            ) : (
              <button
                className="header__links__login"
                onClick={() => navigate('/login')}
              >
                Log in
              </button>
            )}
          </nav>

          {/* Mobile Burger Button */}
          <button
            className="burger-menu"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Mobile Menu Overlay */}
          {isOpen && (
            <div
              className="header__overlay"
              onClick={closeSidebar}
              aria-hidden="true"
            />
          )}

          {/* Mobile Sidebar */}
          <nav className={`header__mobile-menu ${isOpen ? 'header__mobile-menu--open' : ''}`}>

            {/* User Card at top */}
            {isAuthed && (
              <div className="header__mobile-menu__user-card">
                <UserInfo onClick={() => {}} />
              </div>
            )}


            {/* Main Nav Links */}
            <div className="header__mobile-menu__content">
              <span className="header__mobile-menu__section-label">Explore</span>

              <Link
                className={`header__mobile-menu__item ${isActive('/artists') ? 'selected' : ''}`}
                to="/artists"
                onClick={(e) => handleNavigate(e, '/artists')}
              >
                <span className="header__mobile-menu__item__index">01</span>
                Artists
              </Link>

              <Link
                className={`header__mobile-menu__item ${isActive('/selections') ? 'selected' : ''}`}
                to="/selections"
                onClick={(e) => handleNavigate(e, '/selections')}
              >
                <span className="header__mobile-menu__item__index">02</span>
                Weekly Selections
              </Link>

              <Link
                className={`header__mobile-menu__item ${isActive('/about') ? 'selected' : ''}`}
                to="/about"
                onClick={(e) => handleNavigate(e, '/about')}
              >
                <span className="header__mobile-menu__item__index">03</span>
                About
              </Link>

              <button
                className="header__mobile-menu__feedback"
                onClick={() => { setIsContactOpen(true); closeSidebar(); }}
              >
                <span className="header__mobile-menu__feedback__index">?</span>
                Any Questions / Feedback?
              </button>
            </div>

            {/* Account Section */}
            <div className="header__mobile-menu__account">
              <span className="header__mobile-menu__section-label">Account</span>

              {isAuthed && (
                <Link
                  className="header__mobile-menu__account__item"
                  to="/profile"
                  onClick={(e) => { handleNavigate(e, '/profile'); closeSidebar(); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  Profile
                </Link>
              )}

              <Link
                className="header__mobile-menu__account__item"
                to="/terms"
                onClick={(e) => { handleNavigate(e, '/terms'); closeSidebar(); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
                </svg>
                Terms & Conditions
                <svg className="header__mobile-menu__account__item__external" width="9" height="9" viewBox="0 0 16 16" fill="none">
                  <path d="M15.707 0.999999C15.707 0.447715 15.2593 -2.87362e-07 14.707 -5.40243e-07L5.70703 2.60547e-07C5.15475 -7.66277e-08 4.70703 0.447715 4.70703 1C4.70703 1.55228 5.15475 2 5.70703 2L13.707 2L13.707 10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10L15.707 0.999999ZM0.707031 15L1.41414 15.7071L15.4141 1.70711L14.707 1L13.9999 0.292893L-7.55191e-05 14.2929L0.707031 15Z" fill="currentColor" />
                </svg>
              </Link>

              <div className="header__mobile-menu__account__divider" />

              {isAuthed ? (
                <button
                  className="header__mobile-menu__account__logout"
                  onClick={() => { handleLogout(); closeSidebar(); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Logout
                </button>
              ) : (
                <button className="header__mobile-menu__account__subscribe" onClick={() => navigate('/login')}>Log in</button>
              )}
            </div>
          </nav>
        </header>
    </>
  );
};

export default Header;