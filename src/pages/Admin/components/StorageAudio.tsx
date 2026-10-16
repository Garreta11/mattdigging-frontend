import React, { useEffect } from 'react';
import { useStorageUrl } from '../hooks/useStorageUrl';
import { useStreamUrl } from '../../../hooks/useStreamUrl';
import { useAuthContext } from '../../../context/AppContext';

interface StorageAudioProps {
  bucket: string;
  path: string | null | undefined;
  localFile?: File | null;
  /** Saved track: play it through the backend's signed /tracks/:id/stream URL (works with a private bucket). */
  trackId?: string | null;
  audioRef?: React.Ref<HTMLAudioElement>;
  preload?: "none" | "metadata" | "auto";
  onSourceChange?: () => void; // 👈 Nuevo callback
}

/**
 * Audio player for the admin track form.
 * - A file just picked from the computer plays locally.
 * - A saved track plays through the backend's signed stream URL (admins count as members).
 */
export function StorageAudio({
  bucket,
  path,
  localFile,
  trackId,
  audioRef,
  preload = "auto",
  onSourceChange // 👈 Nuevo prop
}: StorageAudioProps) {
  const { user } = useAuthContext();
  const useStream = !localFile && !!trackId;
  const stream = useStreamUrl(useStream ? trackId : null, user?.id, path);
  const storageUrl = useStorageUrl(bucket, useStream ? null : path, localFile);
  const url = useStream ? stream.url : storageUrl;

  // Llamar al callback cuando la URL cambia
  useEffect(() => {
    if (url && onSourceChange) {
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
