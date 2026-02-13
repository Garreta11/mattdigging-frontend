import './Player.scss';
import { useState, useEffect, useRef } from 'react'
import { fetchTracks, Track } from '../../services/api';
import { StorageAudio } from '../../pages/Admin/components/StorageAudio';
import { StorageImage } from '../../pages/Admin/components/StorageImage';
import { useAppContext } from '../../context/AppContext';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const Player = () => {
  const { track, setTrack, playerTrackList, setPlayerTrackList, playlistName } = useAppContext();

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsDisabled, setControlsDisabled] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitialized = useRef(false);
  const previousTrackId = useRef<number | null>(null);
  const isManualTrackChange = useRef(false);

  // --------------------------------
  // LOAD TRACKS INITIAL (solo una vez al montar)
  // --------------------------------
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const loadTracks = async () => {
      const data = await fetchTracks();
      setPlayerTrackList(data);

      if (data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentTrackIndex(randomIndex);
        setPlayedIndices([randomIndex]);
      }
    };

    loadTracks();
  }, [setPlayerTrackList]);

  // --------------------------------
  // REACT TO PLAYLIST CHANGES
  // --------------------------------
  useEffect(() => {
    if (!hasInitialized.current || playerTrackList.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * playerTrackList.length);
    setCurrentTrackIndex(randomIndex);
    setPlayedIndices([randomIndex]);
    setHistory([]);
    setIsPlaying(false);
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
    
    if (trackIndex !== -1) {
      
      if (previousTrackId.current !== track.id) {
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
    }
  }, [track, playerTrackList, currentTrackIndex, playedIndices]);

  // --------------------------------
  // RESET DURATION WHEN TRACK CHANGES
  // --------------------------------
  useEffect(() => {
    setDuration(0);
    setCurrentTime(0);
  }, [currentTrack]);

  // --------------------------------
  // AUDIO EVENTS + SYNC PLAYING STATE
  // --------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    
    if (!audio || !currentTrack) {
      return;
    }

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Fallback: actualizar duración si aún no se ha establecido
      if (duration === 0 && audio.duration) {
        updateDuration();
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
    };

    const handleLoadedData = () => {
      updateDuration();
    };

    const handleCanPlay = () => {
      updateDuration();
    };

    const handleDurationChange = () => {
      updateDuration();
    };

    const handleEnded = () => playNextTrack();
    
    const handlePlay = () => {
      setIsPlaying(true);
      updateDuration();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    // Añadir múltiples listeners para asegurar que capturamos la duración
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Sincronizar estado inicial
    setIsPlaying(!audio.paused);
    
    // Intentar obtener la duración inmediatamente si está disponible
    if (audio.readyState >= 1) { // HAVE_METADATA
      updateDuration();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentTrack]); // Solo depende de currentTrack

  // --------------------------------
  // PLAY / PAUSE CONTROL
  // --------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // --------------------------------
  // AUTO PLAY WHEN TRACK CHANGES
  // --------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch((err) => {
          console.error('Error auto-playing audio:', err);
          setIsPlaying(false);
        });
      }
    };

    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [currentTrack, isPlaying]);

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
    const nextIndex = getRandomUnplayedIndex();
    if (nextIndex === null) return;
  
    if (currentTrackIndex !== null) {
      setHistory(prev => [...prev, currentTrackIndex]);
    }
  
    setCurrentTrackIndex(nextIndex);
    setPlayedIndices(prev => [...prev, nextIndex]);
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
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (!audioRef.current) return;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

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

  return (
    <div className='player'>
      {/* Siempre renderiza el audio, nunca se desmonta */}
      <StorageAudio
        bucket="tracks"
        path={currentTrack ? currentTrack.audio_url : ''}
        audioRef={audioRef}
        preload="auto"
      />

      <div className='player__info'>
        {currentTrack ? (
          <>
            <div className='player__info__text'>
              {playlistName && (
                <p className='player__info__playlist-name'>playlist: {playlistName}</p>
              )}
              <h3>{currentTrack.title}</h3>
              <p>{currentTrack?.artist?.name}</p>
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
              if (controlsDisabled || !audioRef.current || duration === 0) return;
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