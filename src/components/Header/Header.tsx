import React, { useState, useEffect, useRef } from 'react';
import './Header.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import SearchInput from '../SearchInput/SearchInput';
import UserInfo from '../UserInfo/UserInfo';

const Header = () => {
  const { user, isFullscreen, setIsFullscreen } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null); // 👈 ref for the dropdown container

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  const isActive = (path: string) => location.pathname.startsWith(path);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle navigation with fade-out
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

  // Close menu when route changes
  useEffect(() => {
    closeSidebar();
  }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Logout
  const handleLogout = () => {
    // Manually remove all supabase auth keys from localStorage
    // This bypasses the 403 server error and guarantees the session is cleared
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sb-'))
      .forEach((key) => localStorage.removeItem(key));

    // Then call signOut to fire the SIGNED_OUT event through the auth listener
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  };

  // Early return AFTER all hooks
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      {user && (
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
              <Link to="/artists" onClick={(e) => handleNavigate(e, '/artists')}>
                Artists
              </Link>
            </div>

            <div className={`header__links__item ${isActive('/selections') ? 'selected' : ''}`}>
              <Link to="/selections" onClick={(e) => handleNavigate(e, '/selections')}>
                Weekly Selections
              </Link>
            </div>

            <div className={`header__links__item ${isActive('/about') ? 'selected' : ''}`}>
              <Link to="/about" onClick={(e) => handleNavigate(e, '/about')}>
                About
              </Link>
            </div>

            {/* 👇 ref attached here so clicks inside won't close it */}
            <div className="header__links__items header__links__user" ref={dropdownRef}>
              <UserInfo onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} />
              {isUserDropdownOpen && (
                <div className="header__links__user__dropdown">
                  <Link
                    to="/profile"
                    className="header__links__user__dropdown__item"
                    onClick={(e) => {handleNavigate(e, '/profile'); setIsUserDropdownOpen(false);}}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/terms"
                    className="header__links__user__dropdown__item"
                    onClick={(e) => {handleNavigate(e, '/terms'); setIsUserDropdownOpen(false);}}
                  >
                    Terms & Conditions
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.707 0.999999C15.707 0.447715 15.2593 -2.87362e-07 14.707 -5.40243e-07L5.70703 2.60547e-07C5.15475 -7.66277e-08 4.70703 0.447715 4.70703 1C4.70703 1.55228 5.15475 2 5.70703 2L13.707 2L13.707 10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10L15.707 0.999999ZM0.707031 15L1.41414 15.7071L15.4141 1.70711L14.707 1L13.9999 0.292893L-7.55191e-05 14.2929L0.707031 15Z"
                        fill="var(--color-white)"
                      />
                    </svg>
                  </Link>                
                  
                  <div className="header__links__user__dropdown__divider" />
                  
                  <button
                    className="header__links__user__dropdown__item header__links__user__dropdown__item--logout"
                    onClick={() => {handleLogout(); setIsUserDropdownOpen(false);}}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
            <div className="header__mobile-menu__content">
              <Link
                className={`header__mobile-menu__item ${isActive('/artists') ? 'selected' : ''}`}
                to="/artists"
                onClick={(e) => handleNavigate(e, '/artists')}
              >
                Artists
              </Link>

              <Link
                className={`header__mobile-menu__item ${isActive('/selections') ? 'selected' : ''}`}
                to="/selections"
                onClick={(e) => handleNavigate(e, '/selections')}
              >
                Weekly Selections
              </Link>

              <Link
                className={`header__mobile-menu__item ${isActive('/about') ? 'selected' : ''}`}
                to="/about"
                onClick={(e) => handleNavigate(e, '/about')}
              >
                About
              </Link>
            </div>

            <button className="header__mobile-menu__logout" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </header>
      )}
    </>
  );
};

export default Header;