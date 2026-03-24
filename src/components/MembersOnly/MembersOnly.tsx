import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import './MembersOnly.scss';

const MembersOnly = () => {
  const navigate = useNavigate();
  const { isAuthed } = useAppContext();

  return (
    <div className="members-only">
      <div className="members-only__header">
        <div className="members-only__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="members-only__title">Members only</h2>
      </div>
      {isAuthed ? (
        <>
          <p className="members-only__description">
            Subscribe to explore the full archive and discover new music.
          </p>
          <button
            className="members-only__button"
            onClick={() => navigate('/profile')}
          >
            Subscribe
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </>
      ) : (
        <>
          <p className="members-only__description">
            Log in to explore the full archive and discover new music.
          </p>
          <button
            className="members-only__button"
            onClick={() => navigate('/login')}
          >
            Log in
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default MembersOnly;
