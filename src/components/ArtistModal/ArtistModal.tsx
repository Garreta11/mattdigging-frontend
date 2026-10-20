"use client";

import "./ArtistModal.scss";
import { useAppContext } from "../../context/AppContext";
import { FiX } from "react-icons/fi";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import { Artist, Track, fetchTracksByArtist } from "../../services/api";
import ImageStorage from "../ImageStorage/ImageStorage";
import { useState, useEffect } from "react";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";

interface ArtistModalProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
}

const ArtistModal = ({ artist, isOpen, onClose }: ArtistModalProps) => {
  const { track: currentTrack, setTrack, setPlayerTrackList, isMember } = useAppContext();
  const [tracks, setTracks] = useState<Track[]>([]);
  const panelRef = useSwipeToClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen && artist?.id) {
      setTracks([]);
      const maxSelections = isMember ? undefined : 3;
      fetchTracksByArtist(artist.id, maxSelections)
        .then(setTracks)
        .catch(() => setTracks(artist.tracks ?? []));
    }
    // Refetch only when a different artist opens; `artist.tracks` is just the fallback if the fetch fails.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, artist?.id, isMember]);

  if (!isOpen || !artist) return null;

  const hasTracks = tracks.length > 0;

  const handleTrackClick = (clickedTrack: Track) => {
    // Keep the modal open, so you can keep browsing this artist's tracks
    setPlayerTrackList(tracks);
    setTrack(clickedTrack);
  };

  return (
    <div className="artist-modal" onClick={onClose}>
      <div className="artist-modal__backdrop" />
      <div
        className="artist-modal__content"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="artist-modal__drag-handle" />
        <button className="artist-modal__close" onClick={onClose} aria-label="Close">
          <FiX size={24} />
        </button>

        <div className={`artist-modal__header${artist.photo_url ? "" : " artist-modal__header--no-photo"}`}>
          {artist.photo_url && (
            <div className="artist-modal__photo">
              <ImageStorage
                bucket="artist_photos"
                path={artist.photo_url}
                alt={artist.name}
                // Square crop, same size as the Artists page so the hover-loaded photo is reused
                size={600}
              />
            </div>
          )}

          <div className="artist-modal__info">
            <h2 className="artist-modal__name">{artist.name}</h2>
            {artist.country && (
              <div className="artist-modal__detail">
                <span className="artist-modal__detail-label">Country</span>
                <span className="artist-modal__detail-value">{artist.country}</span>
              </div>
            )}
          </div>

          {artist.bio && <p className="artist-modal__bio">{artist.bio}</p>}
        </div>

        {hasTracks && (
          <div className="artist-modal__tracks">
            <h2 className="artist-modal__tracks-title">
              {/* <FiHeadphones size={20} /> */}
              Tracks ({tracks.length})
            </h2>
            <div className="artist-modal__tracks-list">
              {tracks.map((track) => {
                const meta = [track.album_name, track.year].filter(Boolean).join(" · ");
                return (
                  <div
                    key={track.id}
                    className={`artist-modal__track${currentTrack?.id === track.id ? " artist-modal__track--active" : ""}`}
                    onClick={() => handleTrackClick(track)}
                  >
                    <div className="artist-modal__track-cover">
                      {track.cover_url && (
                        <ImageStorage bucket="covers" path={track.cover_url} alt={track.title} />
                      )}
                    </div>
                    <div className="artist-modal__track-info">
                      <h3 className="artist-modal__track-title">{track.title}</h3>
                      {meta && <p className="artist-modal__track-meta">{meta}</p>}
                    </div>
                    {/* stopPropagation inside, so the heart does not start playback */}
                    <FavoriteButton track={track} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistModal;