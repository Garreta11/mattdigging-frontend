interface CloseButtonProps {
  onClick: () => void;
}

// Close (×) button at the top of the content panels (About, Artists, Hidden Gems,
// Playlists, Selections, Profile). Returns to the home page via the page's onClick.
const CloseButton = ({ onClick }: CloseButtonProps) => (
  <div className="main-content__close">
    <button
      type="button"
      className="main-content__close__button"
      onClick={onClick}
      aria-label="Close"
      title="Close"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </button>
  </div>
);

export default CloseButton;
