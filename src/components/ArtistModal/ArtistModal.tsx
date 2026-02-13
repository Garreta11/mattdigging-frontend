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
          </div>
        )}

        <div className="modal__info">
          <h1 className="modal__name">{artist.name}</h1>

          {artist.country && (
            <p className="modal__country">{artist.country}</p>
          )}

          {artist.bio && <p className="modal__bio">{artist.bio}</p>}
        </div>
      </div>
    </div>
  );
};

export default ArtistModal;
