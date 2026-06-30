import { useMemo } from 'react';
import { supabase } from '../lib/supabase';

const IMAGE_BUCKETS = new Set(['covers', 'artists', 'images', 'photos']);

// Default: 2x retina of the 52px cover thumbnail.
const DEFAULT_WIDTH = 104;
const DEFAULT_QUALITY = 75;

export function useStorageUrl(
  bucket: string | null,
  path: string | null | undefined,
  localFile?: File | null,
  imgWidth: number = DEFAULT_WIDTH,
): string | null {
  const url = useMemo(() => {
    if (localFile) return URL.createObjectURL(localFile);
    if (!path || !bucket) return null;
    if (path.startsWith('http')) return path;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    if (IMAGE_BUCKETS.has(bucket)) {
      return data.publicUrl + '?width=' + imgWidth + '&quality=' + DEFAULT_QUALITY + '&resize=cover';
    }

    return data.publicUrl;
  }, [bucket, path, localFile, imgWidth]);

  return url;
}

export function hasStoragePath(path: string | null | undefined): boolean {
  return Boolean(path && path.length > 0);
}
