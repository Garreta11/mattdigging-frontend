import React from 'react';
import { useStorageUrl } from '../hooks/useStorageUrl';

interface StorageAudioProps {
  bucket: string;
  path: string | null | undefined;
  localFile?: File | null;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

/**
 * Component that displays an audio player for files from Supabase Storage using signed URLs.
 * Works with private buckets.
 */
export function StorageAudio({ bucket, path, localFile, audioRef }: StorageAudioProps) {
  const url = useStorageUrl(bucket, path, localFile);

  if (!url) return null;

  return (
    <div className="admin-audio-player">
      <audio ref={audioRef} controls src={url} preload="metadata">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
