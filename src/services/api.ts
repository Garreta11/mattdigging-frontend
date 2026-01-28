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