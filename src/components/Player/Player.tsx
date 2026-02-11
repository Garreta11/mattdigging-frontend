import './Player.scss';
import { useState, useEffect, useRef } from 'react'
import { fetchTracks, Track } from '../../services/api';
import { StorageAudio } from '../../pages/Admin/components/StorageAudio';
import { StorageImage } from '../../pages/Admin/components/StorageImage';
import { useIsMobile } from '../../hooks/useIsMobile';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const Player = () => {
  const isMobile = useIsMobile();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingPlayRef = useRef(false);

  const handleAudioRef = (el: HTMLAudioElement | null) => {
    audioRef.current = el;
    setAudioElement(el);
  };

  // Fetch tracks and preload a random one
  useEffect(() => {
    const loadTracks = async () => {
      const data = await fetchTracks();
      setTracks(data);

      if (data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentTrackIndex(randomIndex);
        setPlayedIndices([randomIndex]);
      }
    };
    loadTracks();
  }, []);

  // Reset ready state and time on track change
  useEffect(() => {
    if (currentTrackIndex === null) return;
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrackIndex]);

  // When audio element is available, listen for canplay + time/duration events
  useEffect(() => {
    const audio = audioElement;
    if (!audio) return;

    const handleCanPlay = () => {
      console.log('[Player] Audio can play');
      setIsReady(true);
      if (pendingPlayRef.current) {
        console.log('[Player] Playing pending track');
        audio.play().catch(err => console.warn('[Player] Play failed:', err));
        pendingPlayRef.current = false;
      }
    };

    const handleLoadedMetadata = () => {
      console.log('[Player] Metadata loaded');
      if (isMobile && !isReady) {
        setIsReady(true);
        // En móvil, intentar reproducir inmediatamente cuando metadata está lista
        if (pendingPlayRef.current) {
          console.log('[Player] Mobile: Playing on metadata loaded');
          audio.play().catch(err => console.warn('[Player] Play failed:', err));
          pendingPlayRef.current = false;
        }
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);

    if (isMobile) {
      if (audio.readyState >= 1) {
        handleLoadedMetadata();
      } else {
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      }
    } else {
      if (audio.readyState >= 3) {
        handleCanPlay();
      } else {
        audio.addEventListener('canplay', handleCanPlay);
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, [audioElement, isMobile, isReady]);

  // Play/pause in sync with isPlaying state
  useEffect(() => {
    if (!audioRef.current || !isReady) return;
    
    if (isPlaying) {
      if (isMobile && !hasUserInteracted) {
        console.log('[Player] First interaction - loading audio');
        audioRef.current.load();
        setHasUserInteracted(true);
      }
      
      audioRef.current.play().catch(err => {
        console.warn('[Player] Play failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isReady, isMobile, hasUserInteracted]);

  // Auto-advance to next track when current ends
  useEffect(() => {
    const audio = audioElement;
    if (!audio) return;

    const handleEnded = () => {
      console.log('[Player] Track ended, playing next');
      playNextTrack();
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [audioElement, tracks, playedIndices, currentTrackIndex, history]);

  const getRandomUnplayedIndex = (): number | null => {
    if (tracks.length === 0) return null;

    if (playedIndices.length >= tracks.length) {
      setPlayedIndices([]);
      return Math.floor(Math.random() * tracks.length);
    }

    const unplayed = tracks
      .map((_, i) => i)
      .filter(i => !playedIndices.includes(i));

    return unplayed[Math.floor(Math.random() * unplayed.length)];
  };

  const playNextTrack = () => {
    const nextIndex = getRandomUnplayedIndex();
    if (nextIndex === null) return;

    console.log('[Player] Playing next track:', nextIndex);

    if (currentTrackIndex !== null) {
      setHistory(prev => [...prev, currentTrackIndex]);
    }
    
    // CRÍTICO: Marcar que queremos reproducir
    pendingPlayRef.current = true;
    setIsPlaying(true); // Mantener el estado de playing
    
    setCurrentTrackIndex(nextIndex);
    setPlayedIndices(prev => [...prev, nextIndex]);
  };

  const playPreviousTrack = () => {
    if (history.length === 0) return;

    const previousIndex = history[history.length - 1];
    console.log('[Player] Playing previous track:', previousIndex);
    
    setHistory(prev => prev.slice(0, -1));

    if (currentTrackIndex !== null) {
      setPlayedIndices(prev => prev.filter(i => i !== currentTrackIndex));
    }

    // CRÍTICO: Marcar que queremos reproducir
    pendingPlayRef.current = true;
    setIsPlaying(true); // Mantener el estado de playing
    
    setCurrentTrackIndex(previousIndex);
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;
  const controlsDisabled = isMobile ? !currentTrack : !isReady;

  return (
    <div className='player'>
      {currentTrack && (
        <StorageAudio
          bucket="tracks"
          path={currentTrack.audio_url}
          audioRef={handleAudioRef}
          preload={isMobile ? "metadata" : "auto"} // Cambiar de "none" a "metadata"
        />
      )}

      <div className='player__info'>
        {currentTrack ? (
          <>
            <StorageImage
              bucket="covers"
              path={currentTrack.cover_url}
              alt={currentTrack.title}
              className="player__info__cover"
            />
            <div className='player__info__text'>
              <h3>{currentTrack.title}</h3>
              <p>{currentTrack?.album_name}</p>
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      <div className='player__controls'>
        <div className='player__controls__buttons'>
          <button
            onClick={playPreviousTrack}
            disabled={controlsDisabled || history.length === 0}
            className='player__btn player__btn--prev'
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9.5 12L18 6V18L9.5 12Z" fill="currentColor"/>
            </svg>
          </button>

          <button
            onClick={togglePlayPause}
            disabled={controlsDisabled}
            className='player__btn player__btn--play'
          >
            {isPlaying ? (
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

          <button
            onClick={playNextTrack}
            disabled={controlsDisabled}
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
            className={`player__controls__progress__bar${controlsDisabled ? ' player__controls__progress__bar--disabled' : ''}`}
            onClick={(e) => {
              if (controlsDisabled || !audioRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const newTime = ratio * duration;
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
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
    </div>
  );
};

export default Player;