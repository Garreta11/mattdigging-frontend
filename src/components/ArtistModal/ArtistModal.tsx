"use client";

import "./ArtistModal.scss";
import { useAppContext } from "../../context/AppContext";
import { FiX } from "react-icons/fi";
import { Artist, Track } from "../../services/api";
import ImageStorage from "../ImageStorage/ImageStorage";

interface ArtistModalProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
}

const ArtistModal = ({ artist, isOpen, onClose }: ArtistModalProps) => {
  const { setIsTrackModalOpen, setTrack } = useAppContext();
  if (!isOpen || !artist) return null;


  const tracks = artist.tracks || [];
  const hasTracks = tracks.length > 0;

  const handleTrackClick = (track: Track) => {
    setTrack(track);
    onClose();
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__backdrop" />
      <div
        className="modal__content"
        onClick={(e) => e.stopPropagation()}
      >

        {artist.photo_url && (
          <div className="modal__image">
            <ImageStorage
              bucket="artist_photos"
              path={artist.photo_url}
              alt={artist.name}
              className="modal__image"
            />
            <button className="modal__close" onClick={onClose}>
              <FiX size={24} />
            </button>
            <div className="modal__image-overlay">
              <div className="modal__image-overlay__content">
                <h1 className="modal__image-overlay__content__title">{artist.name}</h1>
                {artist.bio && <div className="modal__image-overlay__content__info">
                  <p className="modal__image-overlay__content__info__bio">{artist.bio}</p>
                  {artist.country && <p className="modal__image-overlay__content__info__country">{artist.country}</p>}
                </div>
                }
              </div>
            </div>
          </div>
        )}

        {hasTracks && (
          <div className="modal__tracks">
            <h2 className="modal__tracks-title">
              {/* <FiHeadphones size={20} /> */}
              Tracks ({tracks.length})
            </h2>
            <div className="modal__tracks-list">
              {tracks.map((track) => (
                <div key={track.id} className="modal__tracks-list__item" onClick={() => handleTrackClick(track)}>
                  <div className="modal__tracks-list__item__content">
                    {track.cover_url && (
                      <div className="modal__tracks-list__item__cover">
                        <ImageStorage
                          bucket="covers"
                          path={track.cover_url}
                          alt={track.title}
                        />
                      </div>
                    )}
                    <div className="modal__tracks-list__item__info">
                      <div className="modal__tracks-list__item__meta-container">
                        <h3 className="modal__tracks-list__item__title">{track.title}</h3>
                        <div className="modal__tracks-list__item__meta">
                          {track.album_name && (
                            <span className="modal__tracks-list__item__album">
                              {track.album_name}
                            </span>
                          )}
                          {track.year && (
                            <span className="modal__tracks-list__item__year">
                              {track.year}
                            </span>
                          )}
                        </div>
                      </div>
                      {track.description && (
                        <p className="modal__tracks-list__item__description">
                          {track.description}
                        </p>
                      )}
                      
                    </div>
                  </div>
                  <div className="modal__tracks-list__item__play">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistModal;