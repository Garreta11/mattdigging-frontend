import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

// ── Concurrency limiter ──────────────────────────────────────────────────────
const MAX_CONCURRENT = 5;
let active = 0;
const queue: (() => void)[] = [];

function drain() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const next = queue.shift()!;
    active++;
    next();
  }
}

function release() {
  active--;
  drain();
}

function enqueue(fn: () => Promise<void>): () => void {
  let cancelled = false;

  const wrapped = () => {
    if (cancelled) {
      release();
      return;
    }
    fn().finally(release);
  };

  queue.push(wrapped);
  drain();

  return () => {
    cancelled = true;
  };
}
// ────────────────────────────────────────────────────────────────────────────

/**
 * Hook to get a signed URL for a file in Supabase Storage.
 * Works with private buckets since it uses the authenticated client.
 * Requests are queued with a max concurrency of 5 to avoid exhausting
 * the Supabase connection pool.
 */
export function useStorageUrl(
  bucket: string | null,
  path: string | null | undefined,
  localFile?: File | null,
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // If there's a local file (just selected), create object URL
    if (localFile) {
      const objectUrl = URL.createObjectURL(localFile);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    // If no path or bucket, clear URL
    if (!path || !bucket) {
      setUrl(null);
      return;
    }

    // If path is already a full URL, use it directly
    if (path.startsWith('http')) {
      setUrl(path);
      return;
    }

    let cancelled = false;

    const cancelEnqueue = enqueue(async () => {
      if (cancelled) return;

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);

      if (!cancelled) {
        if (error) {
          console.error(`[useStorageUrl] Error getting signed URL for ${bucket}/${path}:`, error.message);
          setUrl(null);
        } else {
          setUrl(data.signedUrl);
        }
      }
    });

    return () => {
      cancelled = true;
      cancelEnqueue();
    };
  }, [bucket, path, localFile]);

  return url;
}

/**
 * Synchronous helper for list thumbnails - returns null initially,
 * component should use useStorageUrl for actual display.
 * This is just for checking if a URL might exist.
 */
export function hasStoragePath(path: string | null | undefined): boolean {
  return Boolean(path && path.length > 0);
}