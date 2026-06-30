// services/api.ts

const API_BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:8787").replace(/\/+$/, "");
// const API_BASE_URL = "http://localhost:8787";

/* =========================
   TYPES
========================= */

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Mood {
  id: string;
  name: string;
  slug: string;
}

export interface Artist {
  id: string;
  name: string;
  slug?: string;
  bio?: string;
  photo_url?: string;
  image_url?: string; // for compatibility
  country?: string;
  tracks?: Track[];
}

export interface Year {
  year: number;
}

export interface Country {
  country: string;
}

export interface Track {
  id: string;
  title: string;
  artist: Artist;
  artist_id: string;
  album_name?: string;
  year?: number;
  decade?: string;
  country?: string;
  season?: string;
  audio_url: string;
  cover_url?: string;
  description?: string;
  is_free?: boolean;
  track_genres?: Array<{ genre: Genre }>;
  track_moods?: Array<{ mood: Mood }>;
}

export interface SelectionTrack {
  tracks: {
    id: string;
    title: string;
    artist_id: string;
    album_name?: string;
    year?: number;
    decade?: string;
    country?: string;
    season?: string;
    audio_url: string;
    cover_url?: string;
    description?: string;
    is_free?: boolean;
    created_at?: string;
  };
}

export interface Selections {
  id: string;
  title: string;
  week_number: number;
  year: number;
  description: string;
  cover_url: string;
  is_published: boolean;
  published_at: string;
  selection_tracks?: SelectionTrack[];
}

export type Playlist = {
  name: string;
  url: string;
};

export type Auth = {
  user: {
    id: string;
    email: string | undefined;
    created_at: string;
  };
  profile: {
    username: any;
    is_member: any;
    subscription_type: any;
    subscription_expires_at: any;
    member_since: any;
  };
};

/* =========================
   BASIC FETCHERS
========================= */

// AUTHENTICATION

export interface DashboardUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  username: string | null;
  is_member: boolean;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  member_since: string | null;
}

export const fetchDashboardUsers = async (token: string): Promise<DashboardUser[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/users`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard users");
  return response.json();
};

export const fetchAuth = async (token: string): Promise<Auth> => {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
};

// STRIPE
export const fetchBillingCheckout = async (
  token: string,
  onReloadAuth: () => void,
  plan?: 'monthly' | 'annual',
): Promise<{ url: string }> => {
  const response = await fetch(`${API_BASE_URL}/billing/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: plan ? JSON.stringify({ plan }) : undefined,
  });
  const json = await response.json();
  if (!response.ok) {
    if (json.error === "You already have a subscription") {
      onReloadAuth();
      return { url: '' };
    }
    throw new Error(json.error || json.message || "Failed to start checkout. Please try again.");
  }
  return json;
};

export const fetchBillingPortal = async (
  token: string,
): Promise<{ url: string }> => {
  const response = await fetch(`${API_BASE_URL}/billing/portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to handle billing portal");
  return response.json();
};

// GENRES
export const fetchGenres = async (): Promise<Genre[]> => {
  const response = await fetch(`${API_BASE_URL}/genres`);
  if (!response.ok) throw new Error("Failed to fetch genres");
  return response.json();
};

export const fetchMoods = async (): Promise<Mood[]> => {
  const response = await fetch(`${API_BASE_URL}/moods`);
  if (!response.ok) throw new Error("Failed to fetch moods");
  return response.json();
};

export const fetchArtists = async (): Promise<Artist[]> => {
  const response = await fetch(`${API_BASE_URL}/artists`);
  if (!response.ok) throw new Error("Failed to fetch artists");
  return response.json();
};

export const fetchTracks = async (
  queryString: string = "",
): Promise<Track[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks${queryString}`);
  if (!response.ok) throw new Error("Failed to fetch tracks");
  return response.json();
};

export const fetchYears = async (): Promise<Year[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks/years`);
  if (!response.ok) throw new Error("Failed to fetch years");
  return response.json();
};

export const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks/countries`);
  if (!response.ok) throw new Error("Failed to fetch countries");
  return response.json();
};

export const fetchSelections = async (): Promise<Selections[]> => {
  const response = await fetch(`${API_BASE_URL}/selections`);
  if (!response.ok) throw new Error("Failed to fetch selections");
  return response.json();
};

export const fetchHiddenGems = async (): Promise<{ selection: Selections; tracks: Track[] }> => {
  const response = await fetch(`${API_BASE_URL}/selections/hidden-gems`);
  if (!response.ok) throw new Error("Failed to fetch Hidden Gems");
  return response.json();
};

export const fetchTracksBySelection = async (
  selectionId: string,
): Promise<Track[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/by-selection/${selectionId}`,
  );
  if (!response.ok) throw new Error("Failed to fetch selection tracks");
  return response.json();
};

export const fetchFreeTracks = async (): Promise<Track[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks/free`);
  if (!response.ok) throw new Error("Failed to fetch free tracks");
  return response.json();
};

export const fetchTrackById = async (id: string): Promise<Track> => {
  const response = await fetch(`${API_BASE_URL}/tracks/${id}`);
  if (!response.ok) throw new Error("Failed to fetch track");
  return response.json();
};

export const fetchTracksByArtist = async (artistId: string, maxSelections?: number): Promise<Track[]> => {
  const params = maxSelections ? `?max_selections=${maxSelections}` : '';
  const response = await fetch(`${API_BASE_URL}/artists/${artistId}/tracks${params}`);
  if (!response.ok) throw new Error("Failed to fetch artist tracks");
  return response.json();
};

export const fetchPlayerTracks = async (): Promise<Track[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks/player`);
  if (!response.ok) throw new Error("Failed to fetch player tracks");
  return response.json();
};

export const fetchPlayerFreeTracks = async (): Promise<Track[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks/player/free`);
  if (!response.ok) throw new Error("Failed to fetch player free tracks");
  return response.json();
};

/* =========================
   SEARCH FUNCTIONS
========================= */

export const searchArtists = async (query: string): Promise<Artist[]> => {
  const response = await fetch(
    `${API_BASE_URL}/artists/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) throw new Error("Failed to search artists");

  return response.json();
};

export const searchTracks = async (query: string): Promise<Track[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) throw new Error("Failed to search tracks");

  return response.json();
};

export const searchCountries = async (query: string): Promise<Country[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/countries/search?q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) throw new Error("Failed to search countries");
  return response.json();
};

export const searchGenres = async (query: string): Promise<Genre[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/genres/search?q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) throw new Error("Failed to search genres");
  return response.json();
};

export const searchMoods = async (query: string): Promise<Mood[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/moods/search?q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) throw new Error("Failed to search moods");
  return response.json();
};
