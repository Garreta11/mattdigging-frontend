import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Artist, TrackListItem, Genre, Mood, Selection } from '../types';

const apiBase = ((process.env.REACT_APP_API_URL as string) || 'http://localhost:3333').replace(/\/+$/, '');

async function withAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

export async function adminFetch(path: string, init: RequestInit = {}) {
  const headers = await withAuthHeaders();
  const mergedHeaders =
    init.body instanceof FormData
      ? { ...headers, ...(init.headers || {}) }
      : { 'Content-Type': 'application/json', ...headers, ...(init.headers || {}) };
  return fetch(`${apiBase}${path}`, {
    ...init,
    headers: mergedHeaders,
  });
}

export async function getSignedUploadUrl(
  kind: 'audio' | 'image',
  file: File,
): Promise<{ signedUrl: string; token: string; path: string }> {
  const res = await adminFetch(`/tracks/upload-url/${kind === 'audio' ? 'audio' : 'image'}`, {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSizeBytes: file.size,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to get signed upload URL');
  return { signedUrl: json.signedUrl, token: json.token, path: json.path };
}

export async function uploadToSignedUrl({
  signedUrl,
  token,
  file,
}: {
  signedUrl: string;
  token: string;
  file: File;
}) {
  const res = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      authorization: `Bearer ${token}`,
      'x-upsert': 'true',
    },
    body: file,
  });
  if (!res.ok) {
    let message = 'Upload failed';
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
}

export function useAdminApi() {
  const refreshArtists = useCallback(async (): Promise<Artist[]> => {
    const headers = await withAuthHeaders();
    const res = await fetch(`${apiBase}/admin/artists`, { headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to load artists');
    return json;
  }, []);

  const refreshTracks = useCallback(async (): Promise<TrackListItem[]> => {
    const headers = await withAuthHeaders();
    const res = await fetch(`${apiBase}/admin/tracks`, { headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to load tracks');
    return json;
  }, []);

  const refreshTags = useCallback(async (): Promise<{ genres: Genre[]; moods: Mood[] }> => {
    const headers = await withAuthHeaders();
    const [genreRes, moodRes] = await Promise.all([
      fetch(`${apiBase}/admin/genres`, { headers }),
      fetch(`${apiBase}/admin/moods`, { headers }),
    ]);
    const genreJson = await genreRes.json();
    const moodJson = await moodRes.json();
    if (!genreRes.ok) throw new Error(genreJson?.error || 'Failed to load genres');
    if (!moodRes.ok) throw new Error(moodJson?.error || 'Failed to load moods');
    return { genres: genreJson, moods: moodJson };
  }, []);

  const refreshSelections = useCallback(async (): Promise<Selection[]> => {
    const headers = await withAuthHeaders();
    const res = await fetch(`${apiBase}/admin/selections?include=tracks`, { headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to load selections');
    return json;
  }, []);

  return {
    refreshArtists,
    refreshTracks,
    refreshTags,
    refreshSelections,
  };
}
