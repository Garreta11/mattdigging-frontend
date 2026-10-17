"use client";

import { useState, useEffect } from "react";
import './HiddenGems.scss';
import { useNavigate } from "react-router-dom";
import { fetchHiddenGems, Selections, Track } from "../../services/api";
import { useAuthContext } from "../../context/AppContext";
import { usePlayerContext } from "../../context/PlayerContext";
import TrackItem from "../../components/TrackItem/TrackItem";
import Loader from "../../components/Loader/Loader";
import MembersOnly from "../../components/MembersOnly/MembersOnly";
import CloseButton from "../../components/CloseButton/CloseButton";

const HiddenGemsPage = () => {
  const navigate = useNavigate();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hiddenGemsSelection, setHiddenGemsSelection] = useState<Selections | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { setPlayerTrackList, setPlaylist, setTrack, track: currentTrack } = usePlayerContext();
  const { isMember, authReady } = useAuthContext();
  const isLoading = dataLoading || !authReady;

  useEffect(() => {
    fetchHiddenGems()
      .then(({ selection, tracks }) => {
        setHiddenGemsSelection(selection);
        setTracks(tracks);
      })
      .catch((err) => console.error("Error loading Hidden Gems:", err))
      .finally(() => setDataLoading(false));
  }, []);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const handlePlaySelection = async () => {
    if (tracks.length > 0 && hiddenGemsSelection) {
      setTrack(null);
      setPlayerTrackList(tracks);
      setPlaylist({ name: hiddenGemsSelection.title, url: '/hidden-gems' });
      await new Promise(resolve => setTimeout(resolve, 0));
      setTrack(tracks[0]);
    }
  };

  const handleTrackClick = (track: Track) => {
    if (hiddenGemsSelection) {
      setPlaylist({ name: hiddenGemsSelection.title, url: '/hidden-gems' });
    }
    setPlayerTrackList(tracks);
    setTrack(track);
  };

  if (isLoading) return <Loader />;

  return (
    <section className={`hidden-gems main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <CloseButton onClick={handleClose} />

      {isMember ? (
        <div className="hidden-gems__content">
          <div className="selectionsPage__selectionView__header">
            <div className="selectionsPage__selectionView__header__title">
              <h2>Hidden Gems</h2>
              <p>new additions every first of the month</p>
            </div>
            {tracks.length > 0 && (
              <button className="selectionsPage__selectionView__header__play-playlist" onClick={handlePlaySelection}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="var(--color-white)"/>
                </svg>
              </button>
            )}
          </div>

          <div className="selectionsPage__selectionView__tracks">
            {tracks.length === 0 ? (
              <p>No tracks found</p>
            ) : (
              tracks.map((track, index) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  onClick={() => handleTrackClick(track)}
                  isPlaying={currentTrack?.id === track.id}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <MembersOnly />
      )}
    </section>
  );
};

export default HiddenGemsPage;
