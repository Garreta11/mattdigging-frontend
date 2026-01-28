export type Artist = {
  id: string;
  name: string;
  bio?: string | null;
  country?: string | null;
  photo_url?: string | null;
};

export type TrackListItem = {
  id: string;
  title: string;
  artist_id: string;
  artist?: { name?: string | null } | null;
  album_name?: string | null;
  year?: number | null;
  decade?: string | null;
  country?: string | null;
  season?: string | null;
  description?: string | null;
  is_free: boolean;
  cover_url?: string | null;
  audio_url?: string | null;
  genre_ids: string[];
  mood_ids: string[];
};

export type Genre = {
  id: string;
  name: string;
  slug: string;
};

export type Mood = {
  id: string;
  name: string;
  slug: string;
};

export type SelectionTrack = {
  track_id: string;
  position: number;
  track?: {
    id: string;
    title: string;
    artists?: { name?: string | null } | null;
  } | null;
};

export type Selection = {
  id: string;
  title?: string | null;
  week_number?: number | null;
  year?: number | null;
  description?: string | null;
  cover_url?: string | null;
  is_published: boolean;
  published_at?: string | null;
  tracks?: SelectionTrack[];
};

export type Tab = 'artists' | 'tracks' | 'tags' | 'selections';

export type ArtistFormData = {
  id: string | null;
  name: string;
  bio: string;
  country: string;
  photo: File | null;
  photo_url: string | null;
};

export type TrackFormData = {
  id: string | null;
  title: string;
  artist_id: string;
  album_name: string;
  year: string;
  decade: string;
  country: string;
  season: string;
  description: string;
  is_free: boolean;
  audio: File | null;
  cover: File | null;
  audio_url: string | null;
  cover_url: string | null;
  genre_ids: string[];
  mood_ids: string[];
};

export type SelectionFormData = {
  id: string | null;
  title: string;
  week_number: string;
  year: string;
  description: string;
  is_published: boolean;
  published_at: string;
  cover: File | null;
};

export const initialArtistForm: ArtistFormData = {
  id: null,
  name: '',
  bio: '',
  country: '',
  photo: null,
  photo_url: null,
};


export const initialTrackForm: TrackFormData = {
  id: null,
  title: '',
  artist_id: '',
  album_name: '',
  year: '',
  decade: '',
  country: '',
  season: '',
  description: '',
  is_free: false,
  audio: null,
  cover: null,
  audio_url: '',
  cover_url: '',
  genre_ids: [],
  mood_ids: [],
};

export const initialSelectionForm: SelectionFormData = {
  id: null,
  title: '',
  week_number: '',
  year: '',
  description: '',
  is_published: false,
  published_at: '',
  cover: null,
};
