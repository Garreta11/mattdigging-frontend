import React, { useEffect, useRef } from 'react';
import './Room.scss';
import Output from './Output';
import { useIsMobile } from '../../hooks/useIsMobile';

const Room: React.FC = () => {
  const isMobile = useIsMobile();

  const roomRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<Output | null>(null);

  useEffect(() => {
    if (!roomRef.current) return;
    outputRef.current = new Output({
      container: roomRef.current,
      isMobile,
      onChestClick: () => {
        console.log('chest clicked');
      }
    });

    return () => {
      outputRef.current?.dispose();
      outputRef.current = null;
    };
  }, [isMobile]);

  return <div className="room" ref={roomRef} />;
};

export default Room;
