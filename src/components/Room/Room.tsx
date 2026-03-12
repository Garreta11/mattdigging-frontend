import React, { useEffect, useRef, useState } from 'react';
import './Room.scss';
import Output from './Output';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAppContext } from '../../context/AppContext';
import { useStorageUrl } from '../../pages/Admin/hooks/useStorageUrl';
import { useNavigate, useLocation } from 'react-router-dom';

const Room: React.FC = () => {
  const {
    track,
    setIsTrackModalOpen,
    isTrackModalOpen,
    setIsFullscreen,
    isSearchModalOpen,
    setIsSearchModalOpen,
  } = useAppContext();

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const roomRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<Output | null>(null);
  const trackRef = useRef(track);

  const [tip, setTip] = useState<string>('');
  const tipRef = useRef<HTMLDivElement>(null);

  const coverUrl = useStorageUrl('covers', track?.cover_url || null, null);
  const coverUrlRef = useRef(coverUrl);

  // Keep trackRef in sync
  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  // Keep coverUrlRef in sync and push new cover to the Output
  useEffect(() => {
    coverUrlRef.current = coverUrl;
    if (outputRef.current && trackRef.current && coverUrlRef.current) {
      outputRef.current.setTrackCover({ backgroundImage: coverUrlRef.current });
    }
  }, [coverUrl]);

  // ─── Single source of truth for interactions ────────────────
  // Interactions are disabled when ANY of these is true:
  //   1. Search modal is open
  //   2. Track modal is open
  //   3. On mobile and not on the home route
  useEffect(() => {
    const shouldDisable =
      isSearchModalOpen ||
      isTrackModalOpen ||
      (isMobile && pathname !== '/');

    outputRef.current?.setInteractionsEnabled(!shouldDisable);
  }, [isSearchModalOpen, isTrackModalOpen, isMobile, pathname]);

  // ─── Keep isMobile in sync with Output ──────────────────────
  useEffect(() => {
    outputRef.current?.setIsMobile(isMobile);
  }, [isMobile]);

  // ─── Mount / unmount Output ─────────────────────────────────
  useEffect(() => {
    if (!roomRef.current) return;

    const navigate_ = navigate;

    const fadeTo = (path: string) => {
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.classList.add('fade-out');
        setTimeout(() => {
          navigate_(path);
          setTimeout(() => {
            mainContent.classList.remove('fade-out');
            mainContent.classList.add('fade-in');
            setTimeout(() => mainContent.classList.remove('fade-in'), 300);
          }, 50);
        }, 1000);
      } else {
        navigate_(path);
      }
      setIsFullscreen(false);
    };

    outputRef.current = new Output({
      container: roomRef.current,

      onChestClick: () => {
        if (isSearchModalOpen) return;
        fadeTo('/hidden-gems');
      },

      onTrackCoverClick: () => {
        if (isSearchModalOpen) return;
        setIsTrackModalOpen(true);
        setIsFullscreen(false);
      },

      onLampClick: () => {
        if (isSearchModalOpen) return;
        fadeTo('/playlists?mood=lava-lamp');
      },

      onShelfClick: () => {
        if (isSearchModalOpen) return;
        fadeTo('/selections');
      },

      onTipChange: (tip: string) => setTip(tip),
    });

    return () => {
      outputRef.current?.dispose();
      outputRef.current = null;
    };
  }, []);

  // Mouse-tracked tooltip
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!tipRef.current || !roomRef.current) return;
      const rect = roomRef.current.getBoundingClientRect();
      tipRef.current.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px)`;
    };

    document.body.addEventListener('mousemove', handleMouseMove);
    return () => document.body.removeEventListener('mousemove', handleMouseMove);
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