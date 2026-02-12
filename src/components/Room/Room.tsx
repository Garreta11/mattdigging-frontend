import React, { useEffect, useRef } from 'react';
import './Room.scss';
import Output from './Output';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAppContext } from '../../context/AppContext';
import { useStorageUrl } from '../../pages/Admin/hooks/useStorageUrl';

const Room: React.FC = () => {
  const { track } = useAppContext();
  const isMobile = useIsMobile();

  const roomRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<Output | null>(null);
  const trackRef = useRef(track);

  // Obtener la URL del cover en el nivel superior del componente
  const coverUrl = useStorageUrl("covers", track?.cover_url || null, null);
  const coverUrlRef = useRef(coverUrl);

  // Mantener trackRef actualizado
  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  // Mantener coverUrlRef actualizado
  useEffect(() => {
    coverUrlRef.current = coverUrl;
  }, [coverUrl]);

  // Crear Output solo una vez al montar
  useEffect(() => {
    if (!roomRef.current) return;
  
    outputRef.current = new Output({
      container: roomRef.current,
      onChestClick: () => {
        console.log('chest clicked');
        
        // SOLO actualizar cover cuando hacen click en el chest
        if (outputRef.current && trackRef.current && coverUrlRef.current) {
          outputRef.current.setTrackCover({
            backgroundImage: coverUrlRef.current, // Usar la ref que tiene la URL
            text: trackRef.current.title || '',
            subtitle: trackRef.current.album_name || ''
          });
        }
      }
    });
  
    return () => {
      outputRef.current?.dispose();
      outputRef.current = null;
    };
  }, []); // ← Sin dependencias
  
  // Actualizar isMobile cuando cambia
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.setIsMobile(isMobile);
    }
  }, [isMobile]);
  
  return <div className="room" ref={roomRef} />;
};

export default Room;