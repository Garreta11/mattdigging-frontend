import React from 'react';
import './TrackItem.scss';
import { Track } from '../../services/api';
import { StorageImage } from '../../pages/Admin/components/StorageImage';

interface TrackItemProps {
  track: Track;
  onClick: () => void;
  isPlaying: boolean;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onClick, isPlaying }) => {
  return (
    <div
      onClick={onClick}
      className={`track-item ${isPlaying ? 'track-item--playing' : ''}`}

    >
      <div className="track-item__cover">
        {track.cover_url ? (
          <StorageImage 
            path={track.cover_url}
            alt={track.title}
            bucket="covers"
          />
        ) : (
          <div className="track-item__cover-placeholder" />
        )}
      </div>

      <div className="track-item__info">
        <div className="track-item__main">
          <h3 className="track-item__title">{track.title}</h3>
          {track.artist && (
            <p className="track-item__artist">{track.artist.name}</p>
          )}
        </div>

        <div className="track-item__meta">
          {track.album_name && (
            <span className="track-item__album">{track.album_name}</span>
          )}
          {track.year && (
            <span className="track-item__year">{track.year}</span>
          )}
        </div>
      </div>

      {track.track_genres && track.track_genres.length > 0 && (
        <div className="track-item__genres">
          {track.track_genres.slice(0, 2).map((tg) => (
            <span key={tg.genre.id} className="track-item__genre">
              {tg.genre.name}
            </span>
          ))}
          {track.track_genres.length > 2 && (
            <span className="track-item__genre-more">
              +{track.track_genres.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackItem;