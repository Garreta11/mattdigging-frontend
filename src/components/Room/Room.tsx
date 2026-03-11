import React, { useEffect, useRef, useState } from 'react';
import './Room.scss';
import Output from './Output';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAppContext } from '../../context/AppContext';
import { useStorageUrl } from '../../pages/Admin/hooks/useStorageUrl';
import { useNavigate } from 'react-router-dom';

const Room: React.FC = () => {
  const { track, setIsTrackModalOpen, isTrackModalOpen, setIsFullscreen } = useAppContext();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const roomRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<Output | null>(null);
  const trackRef = useRef(track);
  
  const [tip, setTip] = useState<string>('');
  const tipRef = useRef<HTMLDivElement>(null);

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
        const path = '/hidden-gems';
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.classList.add('fade-out');
          setTimeout(() => {
            navigate(path);
            setTimeout(() => {
              mainContent.classList.remove('fade-out');
              mainContent.classList.add('fade-in');
              setTimeout(() => {
                mainContent.classList.remove('fade-in');
              }, 300);
            }, 50);
          }, 1000);
        } else {
          navigate(path);
        }
        setIsFullscreen(false);
      },
      onTrackCoverClick: () => {
        setIsTrackModalOpen(true);
        setIsFullscreen(false);
      },
      onLampClick: () => {
        const path = '/playlists?mood=lava-lamp';
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.classList.add('fade-out');
          setTimeout(() => {
            navigate(path);
            setTimeout(() => {
              mainContent.classList.remove('fade-out');
              mainContent.classList.add('fade-in');
              setTimeout(() => {
                mainContent.classList.remove('fade-in');
              }, 300);
            }, 50);
          }, 1000);
        } else {
          navigate(path);
        }
        setIsFullscreen(false);
      },
      onShelfClick: () => {
        const path = '/selections';
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.classList.add('fade-out');
          setTimeout(() => {
            navigate(path);
            setTimeout(() => {
              mainContent.classList.remove('fade-out');
              mainContent.classList.add('fade-in');
              setTimeout(() => {
                mainContent.classList.remove('fade-in');
              }, 300);
            }, 50);
          }, 1000);
        } else {
          navigate(path);
        }
        setIsFullscreen(false);
      },
      onTipChange: (tip: string) => {
        setTip(tip);
      }
    });
  
    return () => {
      outputRef.current?.dispose();
      outputRef.current = null;
    };
  }, []);
  
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

  // Make tip follow the mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!tipRef.current || !roomRef.current) return;

      const rect = roomRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      tipRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };

    document.body?.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.body?.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <div className="room" ref={roomRef}>
      {tip !== '' && (
        <div className="room__tip" ref={tipRef}>
          <p className="room__tip__text">{tip}</p>
        </div>
      )}
    </div>
  );
};

export default Room;