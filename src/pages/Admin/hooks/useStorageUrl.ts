import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Hook to get a signed URL for a file in Supabase Storage.
 * Works with private buckets since it uses the authenticated client.
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

    // Get signed URL from Supabase (valid for 1 hour)
    let cancelled = false;

    async function getSignedUrl() {
      const { data, error } = await supabase.storage
        .from(bucket!)
        .createSignedUrl(path!, 3600); // 1 hour expiry

      if (!cancelled) {
        if (error) {
          console.error(`[useStorageUrl] Error getting signed URL for ${bucket}/${path}:`, error.message);
          setUrl(null);
        } else {
          setUrl(data.signedUrl);
        }
      }
    }

    getSignedUrl();

    return () => {
      cancelled = true;
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
