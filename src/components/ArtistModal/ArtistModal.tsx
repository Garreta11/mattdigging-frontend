"use client";

import "./ArtistModal.scss";
import { FiX } from "react-icons/fi";
import { Artist } from "../../services/api";
import { StorageImage } from "../../pages/Admin/components/StorageImage";

interface ArtistModalProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
}

const ArtistModal = ({ artist, isOpen, onClose }: ArtistModalProps) => {
  if (!isOpen || !artist) return null;

  const tracks = artist.tracks || [];
  const hasTracks = tracks.length > 0;

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose}>
          <FiX size={24} />
        </button>

        {artist.photo_url && (
          <div className="modal__image">
            <StorageImage
              bucket="artist_photos"
              path={artist.photo_url}
              alt={artist.name}
              className="modal__image"
            />
            <div className="modal__image-overlay" />
          </div>
        )}

        <div className="modal__info">
          <div className="modal__header">
            <h1 className="modal__name">{artist.name}</h1>
            {artist.country && (
              <p className="modal__country">{artist.country}</p>
            )}
          </div>

          {artist.bio && <p className="modal__bio">{artist.bio}</p>}

          {hasTracks && (
            <div className="modal__tracks">
              <h2 className="modal__tracks-title">
                {/* <FiHeadphones size={20} /> */}
                Tracks ({tracks.length})
              </h2>
              <div className="modal__tracks-list">
                {tracks.map((track) => (
                  <div key={track.id} className="track-card">
                    {track.cover_url && (
                      <div className="track-card__cover">
                        <StorageImage
                          bucket="covers"
                          path={track.cover_url}
                          alt={track.title}
                        />
                      </div>
                    )}
                    <div className="track-card__info">
                      <h3 className="track-card__title">{track.title}</h3>
                      <div className="track-card__meta">
                        {track.album_name && (
                          <span className="track-card__album">
                            {/* <FiCircle size={14} /> */}
                            {track.album_name}
                          </span>
                        )}
                        {track.year && (
                          <span className="track-card__year">
                            {/* <FiClock size={14} /> */}
                            {track.year}
                          </span>
                        )}
                      </div>
                      {track.description && (
                        <p className="track-card__description">
                          {track.description}
                        </p>
                      )}
                    </div>
                    {track.is_free && (
                      <span className="track-card__badge">Free</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistModal;