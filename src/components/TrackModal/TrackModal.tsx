import React, { useEffect, useState } from 'react';
import './TrackModal.scss';
import { Artist, Track, fetchTrackById } from '../../services/api';
import ImageStorage from '../ImageStorage/ImageStorage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

const TrackModal: React.FC<TrackModalProps> = ({ isOpen, onClose, track }) => {
  const navigate = useNavigate();
  const { setModalArtist, setIsModalArtistOpen } = useAppContext();
  const [fullTrack, setFullTrack] = useState<Track | null>(null);
  const panelRef = useSwipeToClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen && track?.id) {
      setFullTrack(null);
      fetchTrackById(track.id).then(setFullTrack).catch(() => setFullTrack(track));
    }
  }, [isOpen, track?.id]);

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

  const t = fullTrack ?? track;
  const genres = t.track_genres?.map(tg => tg.genre) ?? [];
  const moods = t.track_moods?.map(tm => tm.mood) ?? [];

  const handleGenreClick = (slug: string) => {
    onClose();
    setTimeout(() => {
      if (slug === 'hidden-gems') {
        navigate('/hidden-gems');
      } else {
        navigate(`/playlists?genre=${slug}`);
      }
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

  const handleArtistClick = (artist: Artist) => {
    onClose();
    setModalArtist(artist);
    setIsModalArtistOpen(true);
  };

  return (
    <div className="track-modal" onClick={onClose}>
      <div className="track-modal__backdrop" />
      
      <div className="track-modal__content" ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className="track-modal__drag-handle" />
        <button className="track-modal__close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="track-modal__body">
          {t.cover_url && (
            <div className="track-modal__cover">
              <ImageStorage
                path={t.cover_url}
                alt={t.title}
                bucket="covers"
              />
            </div>
          )}

          <div className="track-modal__info">
            <h2 className="track-modal__title">{t.title}</h2>

            {t.artist && (
              <div className="track-modal__artist" onClick={() => handleArtistClick(t.artist)}>
                {t.artist.photo_url && (
                  <ImageStorage
                    path={t.artist.photo_url}
                    alt={t.artist.name}
                    bucket="artist_photos"
                    className="track-modal__artist-photo"
                  />
                )}
                <span className="track-modal__artist-name">{t.artist.name}</span>
              </div>
            )}

            {t.description && (
              <p className="track-modal__description">{t.description}</p>
            )}

            <div className="track-modal__details">
              {t.album_name && (
                <div className="track-modal__details__detail">
                  <span className="track-modal__details__detail-label">Album</span>
                  <span className="track-modal__details__detail-value">{t.album_name}</span>
                </div>
              )}

              {t.country && (
                <div className="track-modal__details__detail track-modal__details__detail--clickable">
                  <span className="track-modal__details__detail-label">Country</span>
                  <span
                    className="track-modal__details__detail-value track-modal__details__detail-value--link"
                    onClick={() => handleCountryClick(t.country!)}
                  >
                    {t.country}
                  </span>
                </div>
              )}

              {t.year && (
                <div className="track-modal__details__detail track-modal__details__detail--clickable">
                  <span className="track-modal__details__detail-label">Year</span>
                  <span
                    className="track-modal__details__detail-value track-modal__details__detail-value--link"
                    onClick={() => handleYearClick(t.year!)}
                  >
                    {t.year}
                  </span>
                </div>
              )}

              {t.season && (
                <div className="track-modal__details__detail track-modal__details__detail--clickable">
                  <span className="track-modal__details__detail-label">Season</span>
                  <span
                    className="track-modal__details__detail-value track-modal__details__detail-value--link"
                    onClick={() => handleSeasonClick(t.season!)}
                  >
                    {t.season}
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