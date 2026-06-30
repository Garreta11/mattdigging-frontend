import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Hook to get a public URL for a file in Supabase Storage.
 * Requires the bucket to be set to Public in Supabase dashboard.
 * Works without authentication.
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

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    setUrl(data.publicUrl);
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