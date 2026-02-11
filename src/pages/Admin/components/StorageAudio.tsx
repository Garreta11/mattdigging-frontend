import React, { useEffect } from 'react';
import { useStorageUrl } from '../hooks/useStorageUrl';

interface StorageAudioProps {
  bucket: string;
  path: string | null | undefined;
  localFile?: File | null;
  audioRef?: React.Ref<HTMLAudioElement>;
  preload?: "none" | "metadata" | "auto";
  onSourceChange?: () => void; // 👈 Nuevo callback
}

/**
 * Component that displays an audio player for files from Supabase Storage using signed URLs.
 * Works with private buckets.
 */
export function StorageAudio({ 
  bucket, 
  path, 
  localFile, 
  audioRef, 
  preload = "auto",
  onSourceChange // 👈 Nuevo prop
}: StorageAudioProps) {
  const url = useStorageUrl(bucket, path, localFile);

  // Llamar al callback cuando la URL cambia
  useEffect(() => {
    if (url && onSourceChange) {
      console.log('[StorageAudio] URL changed, calling onSourceChange');
      onSourceChange();
    }
  }, [url, onSourceChange]);

  if (!url) return null;

  return (
    <div className="admin-audio-player" style={{ display: 'none' }}>
      <audio ref={audioRef} controls src={url} preload={preload}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}