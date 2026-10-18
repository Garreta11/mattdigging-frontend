import { createContext, useContext, useEffect, useState } from 'react';
import { Artist, Playlist, Track } from '../services/api';

// Browser fullscreen (the whole page), used together with the player's fullscreen room view.
// Must be called from a click handler; not available everywhere (e.g. iPhone Safari), so it fails quietly.
export const enterBrowserFullscreen = () => {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return;
  el.requestFullscreen().catch(() => {});
};

const exitBrowserFullscreen = () => {
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
};

interface PlayerContextType {
  track: Track | null;
  setTrack: (track: Track | null) => void;
  playerTrackList: Track[];
  setPlayerTrackList: (list: Track[]) => void;
  playlist: Playlist | null;
  setPlaylist: (playlist: Playlist | null) => void;
  playlistReady: boolean;
  setPlaylistReady: (ready: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  modalArtist: Artist | null;
  setModalArtist: (artist: Artist | null) => void;
  isModalArtistOpen: boolean;
  setIsModalArtistOpen: (v: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [playerTrackList, setPlayerTrackList] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistReady, setPlaylistReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalArtist, setModalArtist] = useState<Artist | null>(null);
  const [isModalArtistOpen, setIsModalArtistOpen] = useState(false);

  // Leaving the fullscreen view (player button, logo, room clicks…) also leaves browser fullscreen.
  useEffect(() => {
    if (!isFullscreen) exitBrowserFullscreen();
  }, [isFullscreen]);

  // Leaving browser fullscreen (Esc) also leaves the fullscreen view.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        track, setTrack,
        playerTrackList, setPlayerTrackList,
        playlist, setPlaylist,
        playlistReady, setPlaylistReady,
        isFullscreen, setIsFullscreen,
        modalArtist, setModalArtist,
        isModalArtistOpen, setIsModalArtistOpen,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext must be used within PlayerProvider');
  return ctx;
};
