import { useRef, useEffect } from 'react';

const DISMISS_THRESHOLD = 120;

export function useSwipeToClose(isOpen: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !isOpen) return;

    let startY = 0;
    let delta = 0;
    let dragging = false;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      delta = 0;
      dragging = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;

      // If scrolled inside the modal, or trying to scroll up, don't intercept
      if (panel.scrollTop > 0 || dy <= 0) {
        dragging = false;
        return;
      }

      dragging = true;
      delta = dy;
      e.preventDefault();

      panel.style.transition = 'none';
      panel.style.transform = `translateY(${dy}px)`;
      panel.style.opacity = String(Math.max(0, 1 - dy / 300));
    };

    const onTouchEnd = () => {
      if (!dragging) return;

      if (delta > DISMISS_THRESHOLD) {
        panel.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        panel.style.transform = `translateY(100%)`;
        panel.style.opacity = '0';
        setTimeout(() => {
          onClose();
          panel.style.transform = '';
          panel.style.opacity = '';
          panel.style.transition = '';
        }, 250);
      } else {
        panel.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        panel.style.transform = 'translateY(0)';
        panel.style.opacity = '1';
        const cleanup = () => {
          panel.style.transition = '';
          panel.removeEventListener('transitionend', cleanup);
        };
        panel.addEventListener('transitionend', cleanup);
      }

      dragging = false;
      delta = 0;
    };

    panel.addEventListener('touchstart', onTouchStart, { passive: true });
    panel.addEventListener('touchmove', onTouchMove, { passive: false });
    panel.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      panel.removeEventListener('touchstart', onTouchStart);
      panel.removeEventListener('touchmove', onTouchMove);
      panel.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOpen, onClose]);

  return panelRef;
}
