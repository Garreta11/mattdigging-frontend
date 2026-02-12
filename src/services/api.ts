// services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3333';

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
  slug: string;
  bio: string;
  photo_url: string;
  country: string;
}

export interface Track {
  id: number;
  title: string;
  artist: Artist;
  artist_id: number;
  album_name: string;
  year: number;
  decade: string;
  country: string;
  season: string;
  audio_url: string;
  cover_url: string;
  description: string;
  is_free: boolean;
  track_genres?: Array<{ genre: Genre }>;
  track_moods?: Array<{ mood: Mood }>;
}

export const fetchGenres = async (): Promise<Genre[]> => {
  const response = await fetch(`${API_BASE_URL}/genres`);
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  return response.json();
};

export const fetchMoods = async (): Promise<Mood[]> => {
  const response = await fetch(`${API_BASE_URL}/moods`);
  if (!response.ok) {
    throw new Error('Failed to fetch moods');
  }
  return response.json();
};

export const fetchArtists = async (): Promise<Artist[]> => {
  const response = await fetch(`${API_BASE_URL}/artists`);
  if (!response.ok) {
    throw new Error('Failed to fetch artists');
  }
  return response.json();
};

export const fetchTracks = async (queryString: string = ''): Promise<Track[]> => {
  const response = await fetch(`${API_BASE_URL}/tracks${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch tracks');
  return response.json();
};