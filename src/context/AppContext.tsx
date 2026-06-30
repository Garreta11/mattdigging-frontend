import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { User } from "../types/user";
import { supabase } from "../lib/supabase";
import { Auth, fetchAuth } from "../services/api";
import { PlayerProvider, usePlayerContext } from "./PlayerContext";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthed: boolean;
  isMember: boolean;
  isAdmin: boolean;
  loading: boolean;
  setIsAuthed: (isAuthed: boolean) => void;

  isTrackModalOpen: boolean;
  setIsTrackModalOpen: (isOpen: boolean) => void;

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

const AppProviderInner = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const pricingModalTriggered = useRef(false);

  const loadAuth = async (session: Session | null) => {
    if (session?.access_token) {
      try {
        const authData = await fetchAuth(session.access_token);
        setAuth(authData);
      } catch (error) {
        console.error("Error fetching auth data:", error);
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
    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAuth(null);
        setUser(null);
        setIsAuthed(false);
        setAuthReady(true);
        setLoading(false);
        return;
      }
      if (event === "INITIAL_SESSION") return;
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

  const stripCheckoutParam = () => {
    window.history.replaceState({}, "", window.location.pathname);
  };

  const pollMembershipThenWelcome = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { stripCheckoutParam(); return; }
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
    stripCheckoutParam();
  };

  useEffect(() => {
    if (!authReady || pricingModalTriggered.current) return;
    pricingModalTriggered.current = true;
    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (checkout === "success") {
      pollMembershipThenWelcome();
    } else if (checkout === "cancel") {
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
        user, setUser,
        isAuthed, setIsAuthed,
        isMember, isAdmin, loading,
        isTrackModalOpen, setIsTrackModalOpen,
        isSearchModalOpen, setIsSearchModalOpen,
        isPricingModalOpen, setIsPricingModalOpen,
        isMobileMenuOpen, setIsMobileMenuOpen,
        isWelcomeModalOpen, setIsWelcomeModalOpen,
        isCancelModalOpen, setIsCancelModalOpen,
        auth, setAuth,
        authReady, initializeAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Wraps both providers so components can use either hook.
export const AppProvider = ({ children }: { children: React.ReactNode }) => (
  <PlayerProvider>
    <AppProviderInner>{children}</AppProviderInner>
  </PlayerProvider>
);

// Backward-compatible hook — merges AppContext + PlayerContext.
// Existing components keep working without changes.
export const useAppContext = () => {
  const app = useContext(AppContext);
  if (!app) throw new Error("useAppContext must be used within an AppProvider");
  const player = usePlayerContext();
  return { ...app, ...player };
};

// Focused hook: only auth + UI state. Does NOT subscribe to PlayerContext.
// Use in components that need isMember/isAuthed but not player state —
// they won't re-render on track/playlist changes.
export const useAuthContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AppProvider");
  return ctx;
};
