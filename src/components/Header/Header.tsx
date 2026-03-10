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

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  const isActive = (path: string) => location.pathname.startsWith(path);

  const dropdownRef = useRef<HTMLDivElement>(null);


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
    // Don't do anything if we're already on this page
    if (location.pathname === path) {
      closeSidebar();
      return;
    }

    e.preventDefault();
    closeSidebar();

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('fade-out');
      
      // Wait for animation to complete before navigating
      setTimeout(() => {
        navigate(path);
        // Remove fade-out and add fade-in after navigation
        setTimeout(() => {
          mainContent.classList.remove('fade-out');
          mainContent.classList.add('fade-in');
          // Remove fade-in class after animation completes
          setTimeout(() => {
            mainContent.classList.remove('fade-in');
          }, 300);
        }, 50);
      }, 1000); // Match this with your CSS animation duration
    } else {
      // Fallback if main-content doesn't exist
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
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
            // The auth state listener will handle updating the context
      // User will automatically be redirected to SignIn by RequireAuth
    } catch (error) {
      console.error("Error logging out:", error);
    }
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
              <Link
                to="/artists"
                onClick={(e) => handleNavigate(e, '/artists')}
              >
                Artists
              </Link>
            </div>

            <div className={`header__links__item ${isActive('/selections') ? 'selected' : ''}`}>
              <Link
                to="/selections"
                onClick={(e) => handleNavigate(e, '/selections')}
              >
                Weekly Selections
              </Link>
            </div>

            <div className={`header__links__item ${isActive('/about') ? 'selected' : ''}`}>
              <Link
                to="/about"
                onClick={(e) => handleNavigate(e, '/about')}
              >
                About
              </Link>
            </div>

            <div className={`header__links__items header__links__user`}>
              <UserInfo onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} />
              {isUserDropdownOpen && (
                <div className="header__links__user__dropdown" ref={dropdownRef}>
                  <Link
                    to="/terms"
                    className="header__links__user__dropdown__item"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate(e, '/terms');
                      setIsUserDropdownOpen(false);
                    }}
                  >
                    Terms & Conditions
                  </Link>
                  <div className="header__links__user__dropdown__divider" />
                  <button
                    className="header__links__user__dropdown__item header__links__user__dropdown__item--logout"
                    onClick={() => {
                      handleLogout();
                      setIsUserDropdownOpen(false);
                    }}
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

              {/* <div className="header__mobile-menu__user">
                <UserInfo />
              </div> */}
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