import './PlayAllButton.scss';

interface PlayAllButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

// Green "▶ Play …" pill used at the top of a track list (selection, playlist, Hidden Gems).
const PlayAllButton = ({ label, onClick, className }: PlayAllButtonProps) => (
  <button type="button" className={`playAllButton${className ? ` ${className}` : ""}`} onClick={onClick}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14286V18.8571L19 12L8 5.14286Z" /></svg>
    {label}
  </button>
);

export default PlayAllButton;
