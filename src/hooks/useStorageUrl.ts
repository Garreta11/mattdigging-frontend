import { useMemo } from 'react';
import { supabase } from '../lib/supabase';

export function useStorageUrl(
  bucket: string | null,
  path: string | null | undefined,
  localFile?: File | null,
): string | null {
  const url = useMemo(() => {
    // Local file preview
    if (localFile) return URL.createObjectURL(localFile);

    // No path or bucket
    if (!path || !bucket) return null;

    // Already a full URL
    if (path.startsWith('http')) return path;

    // Public URL with image transformation (no network call, instant)
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }, [bucket, path, localFile]);

  return url;
}

export function hasStoragePath(path: string | null | undefined): boolean {
  return Boolean(path && path.length > 0);
}