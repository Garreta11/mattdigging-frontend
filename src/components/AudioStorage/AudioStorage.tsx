import React, { useEffect, forwardRef } from 'react';
import { useStorageUrl } from '../../pages/Admin/hooks/useStorageUrl';

interface StorageAudioProps {
  bucket: string;
  path: string | null | undefined;
  localFile?: File | null;
  preload?: "none" | "metadata" | "auto";
  onSourceChange?: () => void; // 👈 Nuevo callback
}

const AudioStorage = forwardRef<HTMLAudioElement, StorageAudioProps>(
  ({
  bucket,
  path,
  localFile,
  preload,
  onSourceChange
}: StorageAudioProps, ref: React.Ref<HTMLAudioElement>) => {

  const url = useStorageUrl(bucket, path, localFile);

   // Llamar al callback cuando la URL cambia
   useEffect(() => {
    if (url && onSourceChange) {
      onSourceChange();
    }
  }, [url, onSourceChange]);

  if (!url) return null;

  return (
    <div className="admin-audio-player" style={{ display: 'none' }}>
      <audio ref={ref} controls src={url} preload={preload}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
});

AudioStorage.displayName = 'AudioStorage';

export default AudioStorage;