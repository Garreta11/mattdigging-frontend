import { createContext, useContext, useEffect, useState } from "react";
import { User } from "../../types/user";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Track, Artist } from "../services/api";



interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthed: boolean;
  loading: boolean;
  setIsAuthed: (isAuthed: boolean) => void;

  track: Track | null;
  setTrack: (track: Track | null) => void;

  playerTrackList: Track[];
  setPlayerTrackList: (trackList: Track[]) => void;

  playlistName: string | null;
  setPlaylistName: (name: string | null) => void;

  playlistReady: boolean;
  setPlaylistReady: (ready: boolean) => void;

  modalArtist: Artist | null;
  setModalArtist: (artist: Artist | null) => void;

  isModalArtistOpen: boolean;
  setIsModalArtistOpen: (isOpen: boolean) => void;

  isTrackModalOpen: boolean;
  setIsTrackModalOpen: (isOpen: boolean) => void;

  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;

}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [playerTrackList, setPlayerTrackList] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [playlistReady, setPlaylistReady] = useState(false);
  const [modalArtist, setModalArtist] = useState<Artist | null>(null);
  const [isModalArtistOpen, setIsModalArtistOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        updateUserState(session);
      } catch (error) {
        console.error("Error getting session:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);
      updateUserState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserState = (session: Session | null) => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.user_metadata?.name || "",
        username: session.user.user_metadata?.username || "",
        emailVerified: session.user.email_confirmed_at ? new Date(session.user.email_confirmed_at) : new Date(),
        image: session.user.user_metadata?.avatar_url || "",
        bio: session.user.user_metadata?.bio || "",
        isMember: session.user.user_metadata?.is_member || false,
        dateOfBirth: session.user.user_metadata?.date_of_birth ? new Date(session.user.user_metadata.date_of_birth) : new Date(),
        createdAt: new Date(session.user.created_at),
        updatedAt: new Date(session.user.updated_at || session.user.created_at),
      });
      setIsAuthed(true);
    } else {
      setUser(null);
      setIsAuthed(false);
    }
    setLoading(false);
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      isAuthed,
      loading,
      setIsAuthed,
      track,
      setTrack,
      playerTrackList,
      setPlayerTrackList,
      playlistName,
      setPlaylistName,
      playlistReady,
      setPlaylistReady,
      modalArtist,
      setModalArtist,
      isModalArtistOpen,
      setIsModalArtistOpen,
      isTrackModalOpen,
      setIsTrackModalOpen,
      isFullscreen,
      setIsFullscreen,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};