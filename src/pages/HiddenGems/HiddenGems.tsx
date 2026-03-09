"use client";

import { useState, useEffect } from "react";
import './HiddenGems.scss';
import { useNavigate } from "react-router-dom";
import { fetchSelections, fetchTracksBySelection, Selections, Track } from "../../services/api";
import { useAppContext } from "../../context/AppContext";
import TrackItem from "../../components/TrackItem/TrackItem";
import Loader from "../../components/Loader/Loader";

const HiddenGemsPage = () => {
  const navigate = useNavigate();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hiddenGemsSelection, setHiddenGemsSelection] = useState<Selections | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setPlayerTrackList, setPlaylist, setTrack, track: currentTrack } = useAppContext();

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

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const handlePlaySelection = () => {
    if (tracks.length > 0 && hiddenGemsSelection) {
      setPlayerTrackList(tracks);
      setPlaylist({ name: hiddenGemsSelection.title, url: '/hidden-gems' });
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
          <svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.204244 4.65981C-0.069123 4.93318 -0.069123 5.37639 0.204244 5.64976L4.65902 10.1045C4.93238 10.3779 5.3756 10.3779 5.64897 10.1045C5.92233 9.83117 5.92233 9.38795 5.64897 9.11458L1.68917 5.15479L5.64897 1.19499C5.92233 0.92162 5.92233 0.478405 5.64897 0.205038C5.3756 -0.0683293 4.93238 -0.0683293 4.65902 0.205038L0.204244 4.65981ZM33.8867 5.15479V4.45479H0.699219V5.15479V5.85479H33.8867V5.15479Z" fill="var(--color-white)"/>
          </svg>
        </button>
      </div>

      <div className="hidden-gems__content">
        <div className="selectionsPage__selectionView__header">
          <h1 className="selectionsPage__selectionView__header__title">
            <span>Hidden Gems</span>
          </h1>
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
            tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onClick={() => handleTrackClick(track)}
                isPlaying={currentTrack?.id === track.id}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default HiddenGemsPage;