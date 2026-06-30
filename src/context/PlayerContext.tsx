import { createContext, useContext, useState } from 'react';
import { Artist, Playlist, Track } from '../services/api';

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
