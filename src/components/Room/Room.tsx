import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAuthContext } from '../../context/AppContext';
import { usePlayerContext } from '../../context/PlayerContext';
import { useStorageUrl } from '../../hooks/useStorageUrl';
import Output from './Output';
import './Room.scss';

const Room: React.FC = () => {
  const { track, setIsFullscreen } = usePlayerContext();
  const { setIsTrackModalOpen, isTrackModalOpen, isSearchModalOpen, isMobileMenuOpen } = useAuthContext();

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  const roomRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<Output | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const [tip, setTip] = useState<string>('');
  const coverUrl = useStorageUrl('covers', track?.cover_url || null, null, 600);

  // ─── Shared Navigation Logic ────────────────────────────────
  const fadeTo = useCallback((path: string) => {
    const mainContent = document.querySelector('.main-content');
    setIsFullscreen(false);

    if (mainContent) {
      mainContent.classList.add('fade-out');
      setTimeout(() => {
        navigate(path);
        setTimeout(() => {
          mainContent.classList.replace('fade-out', 'fade-in');
          setTimeout(() => mainContent.classList.remove('fade-in'), 300);
        }, 50);
      }, 1000);
    } else {
      navigate(path);
    }
  }, [navigate, setIsFullscreen]);

  // ─── Initialize Output ──────────────────────────────────────
  useEffect(() => {
    if (!roomRef.current) return;

    outputRef.current = new Output({
      container: roomRef.current,
      isMobile,
      onChestClick: () => !isSearchModalOpen && fadeTo('/hidden-gems'),
      onTrackCoverClick: () => {
        if (isSearchModalOpen) return;
        setIsTrackModalOpen(true);
        setIsFullscreen(false);
      },
      onLampClick: () => !isSearchModalOpen && fadeTo('/playlists?mood=lava-lamp'),
      onShelfClick: () => !isSearchModalOpen && fadeTo('/selections'),
      onTipChange: setTip,
    });

    return () => {
      outputRef.current?.dispose();
      outputRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // ─── Sync Logic (Using refs to avoid Output re-instantiation) ──
  useEffect(() => {
    outputRef.current?.setIsMobile(isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (coverUrl) {
      outputRef.current?.setTrackCover({ backgroundImage: coverUrl });
    }
  }, [coverUrl]);

  useEffect(() => {
    const shouldDisable = isSearchModalOpen || isTrackModalOpen || isMobileMenuOpen || (isMobile && pathname !== '/');
    outputRef.current?.setInteractionsEnabled(!shouldDisable);
  }, [isSearchModalOpen, isTrackModalOpen, isMobileMenuOpen, isMobile, pathname]);

  // ─── Optimized Tooltip Movement ─────────────────────────────
  useEffect(() => {
    let frameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!tipRef.current || !roomRef.current) return;
      
      // Use requestAnimationFrame to throttle updates to screen refresh rate
      frameId = requestAnimationFrame(() => {
        const rect = roomRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Use translate3d for GPU acceleration
        if (tipRef.current) {
          tipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, [ ]);

  return (
    <div className="room" ref={roomRef}>
      {tip !== '' && (
        <div className="room__tip" ref={tipRef} style={{ willChange: 'transform' }}>
          <p className="room__tip__text">{tip}</p>
        </div>
      )}
    </div>
  );
};

export default Room;