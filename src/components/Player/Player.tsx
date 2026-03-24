import './Player.scss';
import { useState, useEffect, useRef } from 'react'
import { fetchTracks, fetchFreeTracks, Track, Artist } from '../../services/api';
import AudioStorage from '../AudioStorage/AudioStorage';
import ImageStorage from '../ImageStorage/ImageStorage';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import FavoriteButton from '../FavoriteButton/FavoriteButton';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const Player = () => {
  const navigate = useNavigate();

  const { track, setTrack, playerTrackList, setPlayerTrackList, playlist, setModalArtist, setIsModalArtistOpen, isFullscreen, setIsFullscreen, isAuthed } = useAppContext();

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsDisabled, setControlsDisabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isShuffleMode, setIsShuffleMode] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitialized = useRef(false);
  const isInitialPlaylistLoad = useRef(true);
  const previousTrackId = useRef<string | null>(null);
  const isManualTrackChange = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isPlayingRef = useRef(false);

  // Keep isPlayingRef in sync with isPlaying state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // --------------------------------
  // LOAD TRACKS INITIAL (solo una vez al montar)
  // --------------------------------
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const loadTracks = async () => {
      const data = isAuthed ? await fetchTracks() : await fetchFreeTracks();
      setPlayerTrackList(data);

      if (data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentTrackIndex(randomIndex);
        setPlayedIndices([randomIndex]);
      }
    };

    loadTracks();
  }, [setPlayerTrackList, isAuthed]);

  // --------------------------------
  // REACT TO PLAYLIST CHANGES
  // --------------------------------
  useEffect(() => {
    if (playerTrackList.length === 0) return;

    if (isInitialPlaylistLoad.current) {
      isInitialPlaylistLoad.current = false;
      return;
    }
    
    if (isShuffleMode) {
      const randomIndex = Math.floor(Math.random() * playerTrackList.length);
      setCurrentTrackIndex(randomIndex);
      setPlayedIndices([randomIndex]);
    } else {
      setCurrentTrackIndex(0);
      setPlayedIndices([0]);
    }
    setHistory([]);
    // intentionally NOT setting isPlaying(false) here —
    // play state is owned by track-change effect and user actions only
  }, [playerTrackList]);

  // --------------------------------
  // UPDATE CURRENT TRACK cuando cambie el índice
  // --------------------------------
  useEffect(() => {
    if (currentTrackIndex !== null && playerTrackList.length > 0) {
      const track = playerTrackList[currentTrackIndex];
      setCurrentTrack(track);
      setControlsDisabled(false);
    } else {
      setCurrentTrack(null);
      setControlsDisabled(true);
    }
  }, [currentTrackIndex, playerTrackList]);

  // --------------------------------
  // REACT TO TRACK CHANGES (cuando se selecciona un track específico)
  // --------------------------------
  useEffect(() => {
    if (!track || playerTrackList.length === 0) return;

    const trackIndex = playerTrackList.findIndex(t => t.id === track.id);
    
    if (trackIndex !== -1 && previousTrackId.current !== track.id) {
      previousTrackId.current = track.id;
      isManualTrackChange.current = true;
      
      if (currentTrackIndex !== null && currentTrackIndex !== trackIndex) {
        setHistory(prev => [...prev, currentTrackIndex]);
      }
      
      setCurrentTrackIndex(trackIndex);
      
      if (!playedIndices.includes(trackIndex)) {
        setPlayedIndices(prev => [...prev, trackIndex]);
      }
      
      setIsPlaying(true);
    }
  }, [track, playerTrackList, currentTrackIndex, playedIndices]);

  // --------------------------------
  // RESET WHEN TRACK CHANGES — mark audio as not ready until it loads
  // --------------------------------
  useEffect(() => {
    setDuration(0);
    setCurrentTime(0);
    setIsAudioReady(false);
  }, [currentTrack]);

  // --------------------------------
  // AUDIO EVENTS + SYNC PLAYING STATE
  // --------------------------------
  useEffect(() => {
    if (!currentTrack) return;

    let pollAttempts = 0;
    let cleanupFn: (() => void) | null = null;

    const setup = () => {
      const audio = audioRef.current;

      if (!audio) {
        if (pollAttempts < 30) { // 30 × 50ms = 1500ms
          pollAttempts++;
          setTimeout(setup, 50);
        }
        return;
      }

      const markReady = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
        setIsAudioReady(true);
      };

      const updateDuration = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
        if (duration === 0 && audio.duration) updateDuration();
      };

      const handleLoadedMetadata  = () => updateDuration();
      const handleLoadedData      = () => updateDuration();
      const handleCanPlay         = () => markReady();
      const handleDurationChange  = () => updateDuration();
      const handleEnded           = () => playNextTrack();
      const handlePlay            = () => { setIsPlaying(true); updateDuration(); };
      const handlePause           = () => setIsPlaying(false);

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      setIsPlaying(!audio.paused);

      if (audio.readyState >= 2) {
        markReady();
      }

      cleanupFn = () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
      };
    };

    setup();

    return () => {
      cleanupFn?.();
    };
  }, [currentTrack]);

  // --------------------------------
  // PLAY / PAUSE CONTROL
  // --------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // --------------------------------
  // AUTO PLAY WHEN TRACK CHANGES
  // Uses isPlayingRef to avoid stale closure capturing old isPlaying value
  // --------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const handleCanPlay = () => {
      // if (isPlayingRef.current) {
        audio.play().catch((err) => {
          console.error('Error auto-playing audio:', err);
          setIsPlaying(false);
        });
      // }
    };

    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [currentTrack]);

  useEffect(() => {
    const span = titleRef.current;
    if (!span) return;
    const parent = span.parentElement!;
    const overflow = span.scrollWidth - parent.clientWidth;
    if (overflow > 0) {
      span.style.setProperty("--marquee-offset", `-${overflow}px`);
    } else {
      span.style.removeProperty("--marquee-offset");
      span.style.animation = "none";
    }
  }, [currentTrack?.title]);

  // --------------------------------
  // Actualizar el track en el contexto cuando cambie currentTrack
  // --------------------------------
  useEffect(() => {
    if (currentTrack) {
      if (isManualTrackChange.current) {
        isManualTrackChange.current = false;
        return;
      }
      
      if (currentTrack.id !== previousTrackId.current) {
        previousTrackId.current = currentTrack.id;
        setTrack(currentTrack);
      }
    }
  }, [currentTrack, setTrack]);

  // --------------------------------
  // RANDOM LOGIC
  // --------------------------------
  const getRandomUnplayedIndex = (): number | null => {
    if (playerTrackList.length === 0) return null;

    if (playedIndices.length >= playerTrackList.length) {
      setPlayedIndices([]);
      return Math.floor(Math.random() * playerTrackList.length);
    }

    const available = playerTrackList
      .map((_, i) => i)
      .filter(i => !playedIndices.includes(i));

    if (available.length === 0) {
      setPlayedIndices([]);
      return Math.floor(Math.random() * playerTrackList.length);
    }

    return available[Math.floor(Math.random() * available.length)];
  };

  // --------------------------------
  // NEXT
  // --------------------------------
  const playNextTrack = () => {
    if (playerTrackList.length === 0 || currentTrackIndex === null) return;
  
    let nextIndex: number | null = null;
  
    if (isShuffleMode) {
      nextIndex = getRandomUnplayedIndex();
    } else {
      nextIndex = (currentTrackIndex + 1) % playerTrackList.length;
    }
  
    if (nextIndex === null) return;
  
    setHistory(prev => [...prev, currentTrackIndex]);
    setCurrentTrackIndex(nextIndex);
  
    if (isShuffleMode) {
      setPlayedIndices(prev => [...prev, nextIndex!]);
    }
  
    setIsPlaying(true);
  };

  // --------------------------------
  // PREVIOUS
  // --------------------------------
  const playPreviousTrack = () => {
    if (history.length === 0) return;

    const previousIndex = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentTrackIndex(previousIndex);
    setIsPlaying(true);
  };

  // --------------------------------
  // TOGGLE
  // --------------------------------
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  // --------------------------------
  // SEEK
  // --------------------------------
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // --------------------------------
  // SHUFFLE
  // --------------------------------
  const toggleShuffle = () => {
    setIsShuffleMode(prev => {
      const newValue = !prev;
  
      if (!newValue) {
        setPlayedIndices([]);
      } else {
        if (currentTrackIndex !== null) {
          setPlayedIndices([currentTrackIndex]);
        }
      }
  
      return newValue;
    });
  };

  const handleArtistClick = (artist: Artist) => {
    setModalArtist(artist);
    setIsModalArtistOpen(true);
  };

  const handleFullscreen = (_isFullscreen: boolean) => {
    const el = document.querySelector('.main-content');
    if (el) {
      el.classList.add('fade-out');
    
      const onAnimationEnd = () => {
        el.removeEventListener('animationend', onAnimationEnd);
        navigate('/');
      };    
      el.addEventListener('animationend', onAnimationEnd);
      setTimeout(() => {
        setIsFullscreen(_isFullscreen);
      }, 1000);
    } else {
      setIsFullscreen(_isFullscreen);
    }
  };

  const handleSeePlaylist = (url: string) => {
    navigate(url);
  };

  const isPlayerReady = !!currentTrack && isAudioReady;

  return (
    <div className={`player ${isFullscreen ? 'player--fullscreen' : ''}`}>
      <AudioStorage
        ref={audioRef}
        bucket="tracks"
        path={currentTrack ? currentTrack.audio_url : ''}
        preload="auto"
      />

      <div className='player__fullscreen' onClick={() => handleFullscreen(!isFullscreen)}>
        {isFullscreen ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 0.75C5.5 0.33579 5.16421 0 4.75 0C4.33579 0 4 0.33579 4 0.75V3.25C4 3.66421 3.66421 4 3.25 4H0.75C0.33579 4 0 4.33579 0 4.75C0 5.16421 0.33579 5.5 0.75 5.5H3.25C4.49264 5.5 5.5 4.49264 5.5 3.25V0.75ZM5.5 17.25C5.5 17.6642 5.16421 18 4.75 18C4.33579 18 4 17.6642 4 17.25V14.75C4 14.3358 3.66421 14 3.25 14H0.75C0.33579 14 0 13.6642 0 13.25C0 12.8358 0.33579 12.5 0.75 12.5H3.25C4.49264 12.5 5.5 13.5074 5.5 14.75V17.25ZM13.25 0C12.8358 0 12.5 0.33579 12.5 0.75V3.25C12.5 4.49264 13.5074 5.5 14.75 5.5H17.25C17.6642 5.5 18 5.16421 18 4.75C18 4.33579 17.6642 4 17.25 4H14.75C14.3358 4 14 3.66421 14 3.25V0.75C14 0.33579 13.6642 0 13.25 0ZM12.5 17.25C12.5 17.6642 12.8358 18 13.25 18C13.6642 18 14 17.6642 14 17.25V14.75C14 14.3358 14.3358 14 14.75 14H17.25C17.6642 14 18 13.6642 18 13.25C18 12.8358 17.6642 12.5 17.25 12.5H14.75C13.5074 12.5 12.5 13.5074 12.5 14.75V17.25Z" fill="var(--color-white)"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 2.75C1.5 2.05964 2.05964 1.5 2.75 1.5H4.75C5.16421 1.5 5.5 1.16421 5.5 0.75C5.5 0.33579 5.16421 0 4.75 0H2.75C1.23122 0 0 1.23122 0 2.75V4.75C0 5.16421 0.33579 5.5 0.75 5.5C1.16421 5.5 1.5 5.16421 1.5 4.75V2.75ZM1.5 15.25C1.5 15.9404 2.05964 16.5 2.75 16.5H4.75C5.16421 16.5 5.5 16.8358 5.5 17.25C5.5 17.6642 5.16421 18 4.75 18H2.75C1.23122 18 0 16.7688 0 15.25V13.25C0 12.8358 0.33579 12.5 0.75 12.5C1.16421 12.5 1.5 12.8358 1.5 13.25V15.25ZM15.25 1.5C15.9404 1.5 16.5 2.05964 16.5 2.75V4.75C16.5 5.16421 16.8358 5.5 17.25 5.5C17.6642 5.5 18 5.16421 18 4.75V2.75C18 1.23122 16.7688 0 15.25 0H13.25C12.8358 0 12.5 0.33579 12.5 0.75C12.5 1.16421 12.8358 1.5 13.25 1.5H15.25ZM16.5 15.25C16.5 15.9404 15.9404 16.5 15.25 16.5H13.25C12.8358 16.5 12.5 16.8358 12.5 17.25C12.5 17.6642 12.8358 18 13.25 18H15.25C16.7688 18 18 16.7688 18 15.25V13.25C18 12.8358 17.6642 12.5 17.25 12.5C16.8358 12.5 16.5 12.8358 16.5 13.25V15.25Z" fill="var(--color-white)"/>
          </svg>
        )}
      </div>

      {currentTrack && (
        <FavoriteButton track={currentTrack} />
      )}

      <div className='player__info'>
        {isPlayerReady ? (
          <>
            <ImageStorage
              path={currentTrack?.cover_url}
              alt={currentTrack?.title}
              bucket="covers"
              className='player__info__cover'
            />
            <div className='player__info__text'>
              {playlist?.name && (
                <p className='player__info__playlist-name' onClick={() => handleSeePlaylist(playlist?.url)}>{playlist?.name}</p>
              )}
              <h3>{currentTrack.title}</h3>
              <p className='player__info__artist-name' onClick={() => handleArtistClick(currentTrack?.artist)}>{currentTrack?.artist?.name}</p>
            </div>
          </>
        ) : (
          <div className='player__info__skeleton'>
            <div className='player__info__skeleton__title' />
            <div className='player__info__skeleton__artist' />
          </div>
        )}
      </div>

      <div className='player__controls'>
        <div className='player__controls__buttons'>
          {/* Shuffle button */}
          <button
            onClick={toggleShuffle}
            disabled={controlsDisabled || !isPlayerReady}
            className={`player__btn player__btn--shuffle ${isShuffleMode ? 'player__btn--shuffle--active' : ''}`}
          >
            <svg width="27" height="24" viewBox="0 0 75 66" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M57.0552 1.15066C58.4927 -0.341536 60.8638 -0.388434 62.3599 1.0452L73.0119 11.2752C73.7502 11.9822 74.1642 12.9588 74.1642 13.9822C74.1642 15.0017 73.7501 15.9783 73.0119 16.6853L62.3599 26.9153C60.8638 28.3528 58.4927 28.302 57.0552 26.8098C55.6216 25.3176 55.6685 22.9426 57.1646 21.509L61.0982 17.7317H52.3716C49.7544 17.7317 47.27 18.9036 45.6099 20.927L35.7779 32.896L45.6959 44.919C47.3561 46.9346 49.8326 48.0987 52.4459 48.0987H61.1295L57.2076 44.3175C55.7154 42.88 55.6724 40.505 57.1099 39.0128C58.5474 37.5245 60.9224 37.4816 62.4146 38.9191L73.0196 49.1491C73.7501 49.8561 74.1641 50.8327 74.1641 51.8483C74.1641 52.8678 73.7501 53.8405 73.0196 54.5475L62.4146 64.7815C60.9224 66.219 58.5474 66.176 57.1099 64.6838C55.6724 63.1955 55.7154 60.8205 57.2076 59.383L61.1295 55.5978H52.4459C47.5943 55.5978 42.9967 53.4298 39.9109 49.6876L14.6059 19.0116C12.9457 16.996 10.4692 15.8319 7.85588 15.8319H3.75038C1.67618 15.8319 0.000380516 14.1522 0.000380516 12.0819C0.000380516 10.0077 1.67618 8.33192 3.75038 8.33192H7.85588C12.7075 8.33192 17.3051 10.4999 20.3909 14.2421L30.9139 27.0001L39.8123 16.1641C42.8982 12.4063 47.5076 10.2305 52.3713 10.2305H61.0979L57.1643 6.45322C55.6682 5.01962 55.6213 2.64462 57.0549 1.14852L57.0552 1.15066ZM20.9222 39.1667L25.7855 45.0612L20.4417 51.5651C17.3558 55.3229 12.7503 57.4987 7.8867 57.4987H3.75C1.6758 57.4987 0 55.8229 0 53.7487C0 51.6784 1.6758 49.9987 3.75 49.9987H7.8867C10.5039 49.9987 12.9844 48.8268 14.6484 46.8034L20.9222 39.1667Z" fill="var(--color-white)"/>
            </svg>
          </button>

          {/* Previous button */}
          <button
            onClick={playPreviousTrack}
            disabled={controlsDisabled || history.length === 0 || !isPlayerReady}
            className='player__btn player__btn--prev'
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9.5 12L18 6V18L9.5 12Z" fill="currentColor"/>
            </svg>
          </button>

          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            disabled={controlsDisabled || !isPlayerReady}
            className={`player__btn player__btn--play${!isPlayerReady ? ' player__btn--loading' : ''}`}
          >
            {!isPlayerReady ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className='player__btn--loading'>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round"/>
              </svg>
            ) : isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/>
                <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="currentColor"/>
              </svg>
            )}
          </button>

          {/* Next button */}
          <button
            onClick={playNextTrack}
            disabled={controlsDisabled || !isPlayerReady}
            className='player__btn player__btn--next'
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14.5 12L6 18V6L14.5 12Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className='player__controls__progress'>
          <span className='player__controls__progress__time'>{formatTime(currentTime)}</span>
          <div
            className={`player__controls__progress__bar${controlsDisabled || !isPlayerReady ? ' player__controls__progress__bar--disabled' : ''}`}
            onClick={(e) => {
              if (controlsDisabled || !isPlayerReady || !audioRef.current || duration === 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const newTime = ratio * duration;
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onMouseMove={(e) => { e.preventDefault(); e.stopPropagation(); if (isDragging) handleSeek(e); }}
          >
            <div className='player__controls__progress__track'>
              <div
                className='player__controls__progress__fill'
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              <div
                className='player__controls__progress__thumb'
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className='player__controls__progress__time'>{formatTime(duration)}</span>
        </div>
      </div>

      <div className='player__mobile'>
        <div className='player__mobile__content'>
          <div className='player__mobile__content__info'>
            {isPlayerReady ? (
              <>
                <ImageStorage
                  path={currentTrack?.cover_url}
                  alt={currentTrack?.title}
                  bucket="covers"
                  className='player__mobile__content__info__cover'
                />
                <div className='player__mobile__content__info__text'>
                  {playlist?.name && (
                    <p className='player__mobile__content__info__playlist-name' onClick={() => handleSeePlaylist(playlist?.url)}>{playlist?.name}</p>
                  )}
                  <h3 ref={titleRef}><span>{currentTrack.title}</span></h3>
                  <p>{currentTrack?.artist?.name}</p>
                </div>
              </>
            ) : (
              <div className='player__info__skeleton'>
                <div className='player__info__skeleton__title' />
                <div className='player__info__skeleton__artist' />
              </div>
            )}
          </div>
          <div className='player__mobile__content__buttons'>
            {/* Shuffle button */}
            <button
              onClick={toggleShuffle}
              disabled={controlsDisabled || !isPlayerReady}
              className={`player__btn player__btn--shuffle ${isShuffleMode ? 'player__btn--shuffle--active' : ''}`}
            >
              <svg width="12" height="11" viewBox="0 0 75 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M57.0552 1.15066C58.4927 -0.341536 60.8638 -0.388434 62.3599 1.0452L73.0119 11.2752C73.7502 11.9822 74.1642 12.9588 74.1642 13.9822C74.1642 15.0017 73.7501 15.9783 73.0119 16.6853L62.3599 26.9153C60.8638 28.3528 58.4927 28.302 57.0552 26.8098C55.6216 25.3176 55.6685 22.9426 57.1646 21.509L61.0982 17.7317H52.3716C49.7544 17.7317 47.27 18.9036 45.6099 20.927L35.7779 32.896L45.6959 44.919C47.3561 46.9346 49.8326 48.0987 52.4459 48.0987H61.1295L57.2076 44.3175C55.7154 42.88 55.6724 40.505 57.1099 39.0128C58.5474 37.5245 60.9224 37.4816 62.4146 38.9191L73.0196 49.1491C73.7501 49.8561 74.1641 50.8327 74.1641 51.8483C74.1641 52.8678 73.7501 53.8405 73.0196 54.5475L62.4146 64.7815C60.9224 66.219 58.5474 66.176 57.1099 64.6838C55.6724 63.1955 55.7154 60.8205 57.2076 59.383L61.1295 55.5978H52.4459C47.5943 55.5978 42.9967 53.4298 39.9109 49.6876L14.6059 19.0116C12.9457 16.996 10.4692 15.8319 7.85588 15.8319H3.75038C1.67618 15.8319 0.000380516 14.1522 0.000380516 12.0819C0.000380516 10.0077 1.67618 8.33192 3.75038 8.33192H7.85588C12.7075 8.33192 17.3051 10.4999 20.3909 14.2421L30.9139 27.0001L39.8123 16.1641C42.8982 12.4063 47.5076 10.2305 52.3713 10.2305H61.0979L57.1643 6.45322C55.6682 5.01962 55.6213 2.64462 57.0549 1.14852L57.0552 1.15066ZM20.9222 39.1667L25.7855 45.0612L20.4417 51.5651C17.3558 55.3229 12.7503 57.4987 7.8867 57.4987H3.75C1.6758 57.4987 0 55.8229 0 53.7487C0 51.6784 1.6758 49.9987 3.75 49.9987H7.8867C10.5039 49.9987 12.9844 48.8268 14.6484 46.8034L20.9222 39.1667Z" fill="var(--color-white)"/>
              </svg>
            </button>

            {/* Previous button */}
            <button
              onClick={playPreviousTrack}
              disabled={controlsDisabled || history.length === 0 || !isPlayerReady}
              className='player__btn player__btn--prev'
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9.5 12L18 6V18L9.5 12Z" fill="currentColor"/>
              </svg>
            </button>

            {/* Play/Pause button */}
            <button
              onClick={togglePlayPause}
              disabled={controlsDisabled || !isPlayerReady}
              className={`player__btn player__btn--play${!isPlayerReady ? ' player__btn--loading' : ''}`}
            >
              {!isPlayerReady ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className='player__btn--loading'>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round"/>
                </svg>
              ) : isPlaying ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/>
                  <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="currentColor"/>
                </svg>
              )}
            </button>

            {/* Next button */}
            <button
              onClick={playNextTrack}
              disabled={controlsDisabled || !isPlayerReady}
              className='player__btn player__btn--next'
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14.5 12L6 18V6L14.5 12Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        <div className='player__mobile__progress'>
          <div
            className={`player__controls__progress__bar${controlsDisabled || !isPlayerReady ? ' player__controls__progress__bar--disabled' : ''}`}
            onClick={(e) => {
              if (controlsDisabled || !isPlayerReady || !audioRef.current || duration === 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const newTime = ratio * duration;
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onMouseMove={(e) => { e.preventDefault(); e.stopPropagation(); if (isDragging) handleSeek(e); }}
          >
            <div className='player__controls__progress__track'>
              <div
                className='player__controls__progress__fill'
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              <div
                className='player__controls__progress__thumb'
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;