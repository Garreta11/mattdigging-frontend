import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { User } from "../types/user";
import { supabase } from "../lib/supabase";
import { Artist, Auth, Playlist, Track, fetchAuth } from "../services/api";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthed: boolean;
  isMember: boolean;
  isAdmin: boolean;
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

  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isWelcomeModalOpen: boolean;
  setIsWelcomeModalOpen: (isOpen: boolean) => void;

  isCancelModalOpen: boolean;
  setIsCancelModalOpen: (isOpen: boolean) => void;

  auth: Auth | null;
  setAuth: (auth: Auth | null) => void;

  authReady: boolean;

  initializeAuth: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [authReady, setAuthReady] = useState(false);
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const pricingModalTriggered = useRef(false);

  // Single source of truth for subscription status: fetch the backend auth
  // profile, merge with the Supabase session, and only mark auth ready once
  // everything has resolved. Consumers read `isMember`/`authReady` — they
  // never fetch status themselves.
  const loadAuth = async (session: Session | null) => {
    if (session?.access_token) {
      try {
        const authData = await fetchAuth(session.access_token);
        setAuth(authData);
      } catch (error) {
        console.error("Error fetching auth data:", error);
        // Backend unreachable — fall back to Supabase session metadata only
        setAuth(null);
      }
    } else {
      setAuth(null);
    }

    updateUserState(session);
    setAuthReady(true);
    setLoading(false);
  };

  const initializeAuth = async () => {
    setLoading(true);
    let session = null;
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch (error) {
      console.error("Error getting session:", error);
      setAuth(null);
      updateUserState(null);
      setAuthReady(true);
      setLoading(false);
      return;
    }

    await loadAuth(session);
  };

  useEffect(() => {
    // Resolve session + subscription status once on mount
    initializeAuth();

    // Keep it in sync with auth changes. Re-fetch the backend auth profile so
    // membership stays authoritative without per-component fetches.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // On sign out, clear state immediately without waiting for any server call
      if (event === "SIGNED_OUT") {
        setAuth(null);
        setUser(null);
        setIsAuthed(false);
        setAuthReady(true);
        setLoading(false);
        return;
      }

      // Mount already handles the initial session via initializeAuth()
      if (event === "INITIAL_SESSION") return;

      // SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED → refresh membership
      loadAuth(session);
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
        isAdmin: session.user.app_metadata?.is_admin || session.user.user_metadata?.is_admin || false,
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
  };

  const isMember = isAuthed && (auth?.profile?.is_member === true || user?.isMember === true);
  const isAdmin = isAuthed && user?.isAdmin === true;

  // Remove the ?checkout=... marker Stripe appended on return so a refresh
  // can't re-run the post-payment flow. Done via the History API because the
  // provider sits outside <Router> and has no useNavigate.
  const stripCheckoutParam = () => {
    window.history.replaceState({}, "", window.location.pathname);
  };

  // After a successful checkout, is_member is set asynchronously by the Stripe
  // webhook, so it may still be false on return. Poll the backend auth profile
  // until membership lands, then show the welcome modal.
  const pollMembershipThenWelcome = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      stripCheckoutParam();
      return;
    }
    for (let i = 0; i < 8; i++) {
      try {
        const authData = await fetchAuth(token);
        if (authData?.profile?.is_member === true) {
          setAuth(authData);
          setIsWelcomeModalOpen(true);
          stripCheckoutParam();
          return;
        }
      } catch (error) {
        console.error("Error polling membership:", error);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    // Webhook didn't land in time — clean the URL and let the user retry.
    stripCheckoutParam();
  };

  useEffect(() => {
    // Only decide once subscription status has fully resolved — avoids the
    // modal flashing open then closing while auth is still loading.
    if (!authReady || pricingModalTriggered.current) return;
    pricingModalTriggered.current = true;

    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (checkout === "success") {
      // Returned from a paid checkout — confirm membership, don't nag.
      pollMembershipThenWelcome();
    } else if (checkout === "cancel") {
      // Returned from an abandoned checkout — tell the user nothing was charged
      // and offer to retry from plan selection.
      setIsCancelModalOpen(true);
      stripCheckoutParam();
    } else if (isAuthed && !isMember) {
      setIsPricingModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAuthed, isMember]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthed,
        isMember,
        isAdmin,
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
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isWelcomeModalOpen,
        setIsWelcomeModalOpen,
        isCancelModalOpen,
        setIsCancelModalOpen,
        auth,
        setAuth,
        authReady,
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
