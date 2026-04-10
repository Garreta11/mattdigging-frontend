"use client";

import { useState, useEffect } from "react";
import './HiddenGems.scss';
import { useNavigate } from "react-router-dom";
import { fetchSelections, fetchTracksBySelection, Selections, Track } from "../../services/api";
import { useAppContext } from "../../context/AppContext";
import TrackItem from "../../components/TrackItem/TrackItem";
import Loader from "../../components/Loader/Loader";
import MembersOnly from "../../components/MembersOnly/MembersOnly";

const HiddenGemsPage = () => {
  const navigate = useNavigate();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hiddenGemsSelection, setHiddenGemsSelection] = useState<Selections | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setPlayerTrackList, setPlaylist, setTrack, track: currentTrack, isMember } = useAppContext();

  useEffect(() => {
    const load = async () => {
      try {
        const selections = await fetchSelections();
        const hiddenGems = selections.find(
          (s) => s.title.toLowerCase() === "hidden gems"
        );
        if (hiddenGems) {
          setHiddenGemsSelection(hiddenGems);
          const trackData = await fetchTracksBySelection(hiddenGems.id);
          setTracks(trackData);
        }
      } catch (err) {
        console.error("Error loading Hidden Gems:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleClose = async () => {
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
      <div className="main-content__close">
        <button className="main-content__close__button main-content__close__button--reverse" onClick={handleClose}>
          HOME
          <svg width="17" height="6" viewBox="0 0 17 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_47_2)">
              <path d="M16.898 3.1701C17.0347 3.03342 17.0347 2.81181 16.898 2.67513L14.6706 0.447756C14.5339 0.311057 14.3123 0.311057 14.1756 0.447757C14.0389 0.584422 14.0389 0.806031 14.1756 0.942716L16.1555 2.92261L14.1756 4.90251C14.0389 5.0392 14.0389 5.2608 14.1756 5.39749C14.3123 5.53417 14.5339 5.53417 14.6706 5.39749L16.898 3.1701ZM0.0567477 2.92261L0.0567477 3.27261L16.6505 3.27261L16.6505 2.92261L16.6505 2.57261L0.0567477 2.57261L0.0567477 2.92261Z" fill="var(--color-white)"/>
            </g>
            <defs>
            <clipPath id="clip0_47_2">
            <rect width="17" height="5.5" fill="white" transform="translate(17 5.5) rotate(180)"/>
            </clipPath>
            </defs>
          </svg>

        </button>
      </div>

      {isMember ? (
        <div className="hidden-gems__content">
          <div className="selectionsPage__selectionView__header">
            <div className="selectionsPage__selectionView__header__title">
              <h2>Hidden Gems</h2>
              <p>new additions every first of the </p>
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