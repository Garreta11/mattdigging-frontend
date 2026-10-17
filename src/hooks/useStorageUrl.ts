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

/**
 * URL of a resized copy of a Storage image (Supabase image transformations).
 * Browsers get WebP automatically. Much lighter than the originals, e.g. artist photos are
 * ~1.7 MB PNGs but ~20 KB at 600px. `size` is in pixels: use ~2× the displayed size.
 * `square`: crop to size×size (for round/square thumbnails); otherwise only the width is
 * limited and the original proportions are kept.
 */
export function resizedImageUrl(
  bucket: string,
  path: string | null | undefined,
  size: number,
  square = true,
): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: square
      ? { width: size, height: size, resize: 'cover', quality: 70 }
      : { width: size, quality: 70 },
  });
  return data.publicUrl;
}

export function hasStoragePath(path: string | null | undefined): boolean {
  return Boolean(path && path.length > 0);
}
