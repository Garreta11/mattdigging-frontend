import React, { useState, useEffect } from 'react';
import './Header.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';
/* import UserInfo from '../UserInfo/UserInfo'; */

const Header = () => {
  const { user } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  const isActive = (path: string) => location.pathname.startsWith(path);

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

  // Early return AFTER all hooks
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      {user && (
        <header className="header">
          <div className="header__logo">
            <Link 
              className="header__link" 
              to="/" 
              onClick={(e) => handleNavigate(e, '/')}
            >
              <img className="header__logo__image" src="/svg/logo.svg" alt="Matt Digging" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="header__links header__links--desktop">
            <Link
              className={`header__links__item ${isActive('/artists') ? 'selected' : ''}`}
              to="/artists"
              onClick={(e) => handleNavigate(e, '/artists')}
            >
              Artists
            </Link>

            <Link
              className={`header__links__item ${isActive('/playlists') ? 'selected' : ''}`}
              to="/playlists"
              onClick={(e) => handleNavigate(e, '/playlists')}
            >
              Playlists
            </Link>

            <Link
              className={`header__links__item ${isActive('/search') ? 'selected' : ''}`}
              to="/search"
              onClick={(e) => handleNavigate(e, '/search')}
            >
              Search
            </Link>

            <Link
              className={`header__links__item ${isActive('/selections') ? 'selected' : ''}`}
              to="/selections"
              onClick={(e) => handleNavigate(e, '/selections')}
            >
              Selections
            </Link>

            <Link
              className={`header__links__item ${isActive('/about') ? 'selected' : ''}`}
              to="/about"
              onClick={(e) => handleNavigate(e, '/about')}
            >
              About
            </Link>

            {/* <UserInfo /> */}
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
                className={`header__mobile-menu__item ${isActive('/playlists') ? 'selected' : ''}`}
                to="/playlists"
                onClick={(e) => handleNavigate(e, '/playlists')}
              >
                Playlists
              </Link>

              <Link
                className={`header__mobile-menu__item ${isActive('/search') ? 'selected' : ''}`}
                to="/search"
                onClick={(e) => handleNavigate(e, '/search')}
              >
                Search
              </Link>

              <Link
                className={`header__mobile-menu__item ${isActive('/selections') ? 'selected' : ''}`}
                to="/selections"
                onClick={(e) => handleNavigate(e, '/selections')}
              >
                Selections
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
          </nav>
        </header>
      )}
    </>
  );
};

export default Header;