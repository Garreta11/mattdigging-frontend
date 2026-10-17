import { useMemo } from 'react';
import { resizedImageUrl, useStorageUrl } from '../../hooks/useStorageUrl';

interface StorageImageProps {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  localFile?: File | null;
  /** Load a resized copy (in px, ~2× the displayed size) instead of the original file. */
  size?: number;
  /** With `size`: crop to a square (default) or keep the original proportions. */
  square?: boolean;
}

const ImageStorage = ({ bucket, path, alt, className, localFile, size, square = true }: StorageImageProps) => {
  const originalUrl = useStorageUrl(bucket, size ? null : path, localFile);
  const resizedUrl = useMemo(() => (size && !localFile ? resizedImageUrl(bucket, path, size, square) : null), [bucket, path, size, square, localFile]);
  const url = resizedUrl ?? originalUrl;

  if (!url) return null;

  return <img src={url} alt={alt} className={className} loading="lazy" decoding="async" />;
};

export default ImageStorage;
