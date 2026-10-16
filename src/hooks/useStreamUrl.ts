import { useEffect, useState } from 'react';
import { ApiError, fetchStreamUrl } from '../services/api';
import { supabase } from '../lib/supabase';

// Signed URLs are reused until 10 minutes before they expire, then requested again.
const SAFETY_MARGIN_MS = 10 * 60 * 1000;
const DEFAULT_TTL_MS = 60 * 60 * 1000;

// trackId + user + audio path → URL. The user is part of the key, so after logging out
// a URL fetched for a member is never reused; the audio path, so a replaced file is never stale.
const cache = new Map<string, { url: string; expiresAt: number }>();

export type StreamError = { status: number | null; message: string };

/**
 * Audio URL for the player, from the backend's /tracks/:id/stream (signed and short-lived),
 * instead of a public Storage URL. Sends the Supabase token so members can play member tracks.
 */
export function useStreamUrl(
  trackId: string | null | undefined,
  userId: string | null | undefined,
  audioPath?: string | null,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<StreamError | null>(null);

  useEffect(() => {
    setUrl(null);
    setError(null);
    if (!trackId) return;

    const key = `${trackId}:${userId ?? 'guest'}:${audioPath ?? ''}`;
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      setUrl(cached.url);
      return;
    }

    // Ignore the answer if the track changed before it arrived.
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const result = await fetchStreamUrl(trackId, data.session?.access_token);
        const ttl = result.expiresInSeconds ? result.expiresInSeconds * 1000 - SAFETY_MARGIN_MS : DEFAULT_TTL_MS;
        cache.set(key, { url: result.url, expiresAt: Date.now() + Math.max(0, ttl) });
        if (!cancelled) setUrl(result.url);
      } catch (err) {
        if (cancelled) return;
        setError({
          status: err instanceof ApiError ? err.status : null,
          message: err instanceof Error ? err.message : 'Could not load this track',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackId, userId, audioPath]);

  return { url, error };
}
