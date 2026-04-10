import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { User } from "../../types/user";
import { supabase } from "../lib/supabase";
import { Artist, Auth, Playlist, Track, fetchAuth } from "../services/api";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthed: boolean;
  isMember: boolean;
  loading: boolean;
  setIsAuthed: (isAuthed: boolean) => void;

  track: Track | null;
  setTrack: (track: Track | null) => void;

  playerTrackList: Track[];
  setPlayerTrackList: (trackList: Track[]) => void;

  playlist: Playlist | null;
  setPlaylist: (playlist: Playlist | null) => void;

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

  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (isOpen: boolean) => void;

  isPricingModalOpen: boolean;
  setIsPricingModalOpen: (isOpen: boolean) => void;

  auth: Auth | null;
  setAuth: (auth: Auth | null) => void;

  initializeAuth: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [playerTrackList, setPlayerTrackList] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistReady, setPlaylistReady] = useState(false);
  const [modalArtist, setModalArtist] = useState<Artist | null>(null);
  const [isModalArtistOpen, setIsModalArtistOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const pricingModalTriggered = useRef(false);

  const initializeAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const authData = await fetchAuth(token);
        setAuth(authData);
      }

      updateUserState(session);
    } catch (error) {
      console.error("Error getting session:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active session on mount
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // On sign out, clear state immediately without waiting for any server call
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAuthed(false);
        setLoading(false);
        return;
      }

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
        emailVerified: session.user.email_confirmed_at
          ? new Date(session.user.email_confirmed_at)
          : new Date(),
        image: session.user.user_metadata?.avatar_url || "",
        bio: session.user.user_metadata?.bio || "",
        isMember: session.user.user_metadata?.is_member || false,
        dateOfBirth: session.user.user_metadata?.date_of_birth
          ? new Date(session.user.user_metadata.date_of_birth)
          : new Date(),
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

  const isMember = isAuthed && auth?.profile?.is_member === true;

  useEffect(() => {
    if (!loading && auth !== null && !pricingModalTriggered.current) {
      pricingModalTriggered.current = true;
      if (isAuthed && !isMember) {
        setIsPricingModalOpen(true);
      }
    }
  }, [loading, auth, isAuthed, isMember]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthed,
        isMember,
        loading,
        setIsAuthed,
        track,
        setTrack,
        playerTrackList,
        setPlayerTrackList,
        playlist,
        setPlaylist,
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
        isSearchModalOpen,
        setIsSearchModalOpen,
        isPricingModalOpen,
        setIsPricingModalOpen,
        auth,
        setAuth,
        initializeAuth,
      }}
    >
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
