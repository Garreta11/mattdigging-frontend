// services/api.ts

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3333";

/* =========================
   TYPES
========================= */

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Mood {
  id: number;
  name: string;
  slug: string;
}

export interface Artist {
  id: number;
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
  id: number;
  title: string;
  artist: Artist;
  artist_id: number;
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

/* =========================
   BASIC FETCHERS
========================= */

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
  queryString: string = ""
): Promise<Track[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks${queryString}`);
  if (!response.ok) throw new Error("Failed to fetch tracks");
  return response.json();
};

export const fetchYears = async (): Promise<Year[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks/years`);
  if (!response.ok) throw new Error('Failed to fetch years');
  return response.json();
};

export const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks/countries`);
  if (!response.ok) throw new Error('Failed to fetch countries');
  return response.json();
};

export const fetchSelections = async (): Promise<Selections[]> => {
  const response = await fetch(`${API_BASE_URL}/selections`);
  if (!response.ok) throw new Error('Failed to fetch selections');
  return response.json();
};

export const fetchTracksBySelection = async (selectionId: string): Promise<Track[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks/by-selection/${selectionId}`);
  if (!response.ok) throw new Error("Failed to fetch selection tracks");
  return response.json();
};

/* =========================
   SEARCH FUNCTIONS
========================= */

export const searchArtists = async (
  query: string
): Promise<Artist[]> => {
  const response = await fetch(
    `${API_BASE_URL}/artists/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) throw new Error("Failed to search artists");

  return response.json();
};

export const searchTracks = async (
  query: string
): Promise<Track[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) throw new Error("Failed to search tracks");

  return response.json();
};

export const searchCountries = async (
  query: string
): Promise<Country[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/countries/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error("Failed to search countries");
  return response.json();
};

export const searchGenres = async (query: string): Promise<Genre[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/genres/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error("Failed to search genres");
  return response.json();
};

export const searchMoods = async (query: string): Promise<Mood[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tracks/moods/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error("Failed to search moods");
  return response.json();
};
