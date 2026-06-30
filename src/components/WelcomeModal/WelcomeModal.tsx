import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './WelcomeModal.scss';

const WelcomeModal = () => {
  const { isWelcomeModalOpen, setIsWelcomeModalOpen } = useAppContext();
  const navigate = useNavigate();

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isWelcomeModalOpen) return;

    const tl = gsap.timeline();

    tl.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    )
      .fromTo(
        contentRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
        '-=0.25'
      )
      .fromTo(
        '.welcome-modal__check',
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' },
        '-=0.3'
      )
      .fromTo(
        '.welcome-modal__title, .welcome-modal__subtitle, .welcome-modal__cta',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.45, ease: 'power2.out' },
        '-=0.2'
      );
  }, [isWelcomeModalOpen]);

  // Lock background scroll while open so the overlay is the only scroll surface.
  useEffect(() => {
    if (!isWelcomeModalOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isWelcomeModalOpen]);

  const closeModal = (callback?: () => void) => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsWelcomeModalOpen(false);
        callback?.();
      },
    });
    tl.to(contentRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    }).to(overlayRef.current, { opacity: 0, duration: 0.25 }, '-=0.1');
  };

  if (!isWelcomeModalOpen) return null;

  return (
    <div
      className="welcome-modal-overlay"
      ref={overlayRef}
      onClick={() => closeModal()}
      data-lenis-prevent
    >
      <div
        className="welcome-modal"
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="welcome-modal__close"
          onClick={() => closeModal()}
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Check */}
        <span className="welcome-modal__check" aria-hidden>
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>

        {/* Copy */}
        <h2 className="welcome-modal__title">Welcome to the site!</h2>
        <p className="welcome-modal__subtitle">
          Your membership is active. The full library is now yours to explore.
        </p>

        {/* CTA */}
        <button
          className="welcome-modal__cta"
          onClick={() => closeModal(() => navigate('/'))}
        >
          Start exploring
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
