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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
      console.log('Initial tracks loaded:', data);

      if (data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentTrackIndex(randomIndex);
        setPlayedIndices([randomIndex]);
        // NO establecer isPlaying aquí, dejar que el usuario lo active manualmente
      }
    };

    loadTracks();
  }, [setPlayerTrackList]);

  // --------------------------------
  // REACT TO PLAYLIST CHANGES
  // --------------------------------
  useEffect(() => {
    // Solo reaccionar si ya se inicializó y playerTrackList tiene contenido
    if (!hasInitialized.current || playerTrackList.length === 0) return;

    console.log('Playlist changed:', playerTrackList);
    
    // Resetear el estado cuando cambie la playlist
    const randomIndex = Math.floor(Math.random() * playerTrackList.length);
    setCurrentTrackIndex(randomIndex);
    setPlayedIndices([randomIndex]);
    setHistory([]);
    setIsPlaying(false); // Auto-play cuando se carga nueva playlist
  }, [playerTrackList]);

  // --------------------------------
  // REACT TO TRACK CHANGES (cuando se selecciona un track específico)
  // --------------------------------
  useEffect(() => {
    if (!track || playerTrackList.length === 0) return;

    // Buscar el índice del track en la playlist actual
    const trackIndex = playerTrackList.findIndex(t => t.id === track.id);
    
    if (trackIndex !== -1) {
      console.log('Track change detected:', track, 'Index:', trackIndex, 'Current:', currentTrackIndex);
      
      // Si el track ID cambió o si es la primera vez
      if (previousTrackId.current !== track.id) {
        console.log('Track ID changed, updating player');
        previousTrackId.current = track.id;
        isManualTrackChange.current = true;
        
        // Actualizar el índice actual
        if (currentTrackIndex !== null && currentTrackIndex !== trackIndex) {
          setHistory(prev => [...prev, currentTrackIndex]);
        }
        
        setCurrentTrackIndex(trackIndex);
        
        // Solo agregar a playedIndices si no está ya
        if (!playedIndices.includes(trackIndex)) {
          setPlayedIndices(prev => [...prev, trackIndex]);
        }
        
        setIsPlaying(true); // Auto-play cuando se selecciona un track
      }
    }
  }, [track, playerTrackList]);

  // --------------------------------
  // AUDIO EVENTS + SYNC PLAYING STATE
  // --------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => playNextTrack();
    
    // Sincronizar el estado isPlaying con el estado real del audio
    const handlePlay = () => {
      console.log('Audio play event');
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('Audio pause event');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Sincronizar estado inicial
    setIsPlaying(!audio.paused);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentTrackIndex]);

  // --------------------------------
  // PLAY / PAUSE CONTROL
  // --------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  // --------------------------------
  // AUTO PLAY WHEN TRACK CHANGES
  // --------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
  }, [currentTrackIndex, isPlaying]);

  // --------------------------------
  // RANDOM LOGIC
  // --------------------------------
  const getRandomUnplayedIndex = (): number | null => {
    if (playerTrackList.length === 0) return null;

    if (playedIndices.length >= playerTrackList.length) {
      setPlayedIndices([]);
    }

    const available = playerTrackList
      .map((_, i) => i)
      .filter(i => !playedIndices.includes(i));

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
  };

  // --------------------------------
  // PREVIOUS
  // --------------------------------
  const playPreviousTrack = () => {
    if (history.length === 0) return;

    const previousIndex = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentTrackIndex(previousIndex);
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

  const currentTrack =
    currentTrackIndex !== null ? playerTrackList[currentTrackIndex] : null;

  const controlsDisabled = !currentTrack;

  // Actualizar el track en el contexto cuando cambie currentTrackIndex
  // PERO solo si no fue un cambio manual
  useEffect(() => {
    if (currentTrack) {
      // Si fue un cambio manual, no actualizar el contexto
      if (isManualTrackChange.current) {
        isManualTrackChange.current = false;
        return;
      }
      
      // Solo actualizar si el ID cambió
      if (currentTrack.id !== previousTrackId.current) {
        previousTrackId.current = currentTrack.id;
        setTrack(currentTrack);
      }
    }
  }, [currentTrackIndex, currentTrack, setTrack]);

  return (
    <div className='player'>
      {currentTrack && (
        <StorageAudio
          bucket="tracks"
          path={currentTrack.audio_url}
          audioRef={audioRef}
          preload={"auto"}
        />
      )}

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