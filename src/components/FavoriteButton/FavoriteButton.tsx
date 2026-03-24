import { Track } from '../../services/api';
import { useFavorites } from '../../hooks/useFavorites';
import './FavoriteButton.scss';
import { useAppContext } from '../../context/AppContext';

interface FavoriteButtonProps {
  track: Track;
  className?: string;
}

const FavoriteButton = ({ track, className = '' }: FavoriteButtonProps) => {
  const { isMember } = useAppContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(track.id);

  return (
    <button
      className={`favorite-btn ${active ? 'favorite-btn--active' : ''} ${className} ${isMember ? '' : 'members-only'}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(track);
      }}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};

export default FavoriteButton;