import React, { useEffect } from 'react';
import './TrackModal.scss';
import { Track } from '../../services/api';
import { StorageImage } from '../../pages/Admin/components/StorageImage';
import { useNavigate } from 'react-router-dom';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

const TrackModal: React.FC<TrackModalProps> = ({ isOpen, onClose, track }) => {
  const navigate = useNavigate();

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  const genres = track.track_genres?.map(tg => tg.genre) ?? [];
  const moods = track.track_moods?.map(tm => tm.mood) ?? [];

  const handleGenreClick = (slug: string) => {
    onClose();
    setTimeout(() => {
      navigate(`/playlists?genre=${slug}`);
    }, 300);
  };

  const handleMoodClick = (slug: string) => {
    onClose();
    setTimeout(() => {
      navigate(`/playlists?mood=${slug}`);
    }, 300);
  };

  const handleCountryClick = (country: string) => {
    onClose();
    setTimeout(() => {
      navigate(`/playlists?country=${encodeURIComponent(country)}`);
    }, 300);
  };

  const handleYearClick = (year: number) => {
    onClose();
    setTimeout(() => {
      navigate(`/playlists?year=${year}`);
    }, 300);
  };

  const handleSeasonClick = (season: string) => {
    onClose();
    setTimeout(() => {
      navigate(`/playlists?season=${season.toLowerCase()}`);
    }, 300);
  };

  return (
    <div className="track-modal" onClick={onClose}>
      <div className="track-modal__backdrop" />
      
      <div className="track-modal__content" onClick={(e) => e.stopPropagation()}>
        <button className="track-modal__close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="track-modal__body">
          {track.cover_url && (
            <div className="track-modal__cover">
              <StorageImage 
                path={track.cover_url} 
                alt={track.title}
                bucket="covers"
              />
            </div>
          )}

          <div className="track-modal__info">
            <h2 className="track-modal__title">{track.title}</h2>
            
            {track.artist && (
              <div className="track-modal__artist">
                {track.artist.photo_url && (
                  <StorageImage 
                    path={track.artist.photo_url}
                    alt={track.artist.name}
                    bucket="artist_photos"
                    className="track-modal__artist-photo"
                  />
                )}
                <span className="track-modal__artist-name">{track.artist.name}</span>
              </div>
            )}

            {track.description && (
              <p className="track-modal__description">{track.description}</p>
            )}

            <div className="track-modal__details">
              {track.album_name && (
                <div className="track-modal__detail">
                  <span className="track-modal__detail-label">Album</span>
                  <span className="track-modal__detail-value">{track.album_name}</span>
                </div>
              )}

              {track.country && (
                <div className="track-modal__detail track-modal__detail--clickable">
                  <span className="track-modal__detail-label">Country</span>
                  <span 
                    className="track-modal__detail-value track-modal__detail-value--link"
                    onClick={() => handleCountryClick(track.country!)}
                  >
                    {track.country}
                  </span>
                </div>
              )}

              {track.year && (
                <div className="track-modal__detail track-modal__detail--clickable">
                  <span className="track-modal__detail-label">Year</span>
                  <span 
                    className="track-modal__detail-value track-modal__detail-value--link"
                    onClick={() => handleYearClick(track.year!)}
                  >
                    {track.year}
                  </span>
                </div>
              )}

              {track.season && (
                <div className="track-modal__detail track-modal__detail--clickable">
                  <span className="track-modal__detail-label">Season</span>
                  <span 
                    className="track-modal__detail-value track-modal__detail-value--link"
                    onClick={() => handleSeasonClick(track.season!)}
                  >
                    {track.season}
                  </span>
                </div>
              )}
            </div>

            {genres.length > 0 && (
              <div className="track-modal__tags">
                <div className="track-modal__tags-label">Genres</div>
                <div className="track-modal__tags-list">
                  {genres.map((genre) => (
                    <span 
                      key={genre.id} 
                      className="track-modal__tag track-modal__tag--genre"
                      onClick={() => handleGenreClick(genre.slug)}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {moods.length > 0 && (
              <div className="track-modal__tags">
                <span className="track-modal__tags-label">Moods</span>
                <div className="track-modal__tags-list">
                  {moods.map((mood) => (
                    <span 
                      key={mood.id} 
                      className="track-modal__tag track-modal__tag--mood"
                      onClick={() => handleMoodClick(mood.slug)}
                    >
                      {mood.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackModal;