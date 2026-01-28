import React from 'react';
import { useStorageUrl } from '../hooks/useStorageUrl';

interface StorageImageProps {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  localFile?: File | null;
}

/**
 * Component that displays an image from Supabase Storage using signed URLs.
 * Works with private buckets.
 */
export function StorageImage({ bucket, path, alt, className, localFile }: StorageImageProps) {
  const url = useStorageUrl(bucket, path, localFile);

  if (!url) return null;

  return <img src={url} alt={alt} className={className} />;
}
