import './Footer.scss';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const { user } = useAppContext();
  const location = useLocation();

  // Hide footer on admin routes
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log("Logged out successfully");
      // The auth state listener will handle updating the context
      // User will automatically be redirected to SignIn by RequireAuth
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Only show logout if user exists
  if (!user) {
    return null;
  }

  return (
    <footer className="footer">
      <button className="footer__logout-button" onClick={handleLogout}>
        Logout
      </button>
    </footer>
  );
};

export default Footer;