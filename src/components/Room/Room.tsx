import React, { useEffect, useRef } from 'react';
import './Room.scss';
import Output from './Output';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAppContext } from '../../context/AppContext';
import { useStorageUrl } from '../../pages/Admin/hooks/useStorageUrl';

const Room: React.FC = () => {
  const { track, setIsTrackModalOpen, isTrackModalOpen } = useAppContext();
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
    if (outputRef.current && trackRef.current && coverUrlRef.current) {
      outputRef.current.setTrackCover({
        backgroundImage: coverUrlRef.current,
      });
    }
  }, [coverUrl]);

  // Crear Output solo una vez al montar
  useEffect(() => {
    if (!roomRef.current) return;
  
    outputRef.current = new Output({
      container: roomRef.current,
      onChestClick: () => {
      },
      onTrackCoverClick: () => {
        setIsTrackModalOpen(true);
        console.log(track)
      }
    });
  
    return () => {
      outputRef.current?.dispose();
      outputRef.current = null;
    };
  }, [track]);
  
  // Actualizar isMobile cuando cambia
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.setIsMobile(isMobile);
    }
  }, [isMobile]);

  // Deshabilitar interacciones cuando el modal está abierto
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.setInteractionsEnabled(!isTrackModalOpen);
    }
  }, [isTrackModalOpen]);
  
  return (
    <>
      <div className="room" ref={roomRef} />
    </>
  );
};

export default Room;