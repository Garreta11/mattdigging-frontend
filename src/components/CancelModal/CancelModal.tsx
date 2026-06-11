import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAppContext } from '../../context/AppContext';
import './CancelModal.scss';

const CancelModal = () => {
  const { isCancelModalOpen, setIsCancelModalOpen, setIsPricingModalOpen } =
    useAppContext();

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCancelModalOpen) return;

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
        '.cancel-modal__icon',
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' },
        '-=0.3'
      )
      .fromTo(
        '.cancel-modal__title, .cancel-modal__subtitle, .cancel-modal__actions',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.45, ease: 'power2.out' },
        '-=0.2'
      );
  }, [isCancelModalOpen]);

  // Lock background scroll while open so the overlay is the only scroll surface.
  useEffect(() => {
    if (!isCancelModalOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCancelModalOpen]);

  const closeModal = (callback?: () => void) => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsCancelModalOpen(false);
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

  if (!isCancelModalOpen) return null;

  return (
    <div
      className="cancel-modal-overlay"
      ref={overlayRef}
      onClick={() => closeModal()}
      data-lenis-prevent
    >
      <div
        className="cancel-modal"
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="cancel-modal__close"
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

        {/* Icon */}
        <span className="cancel-modal__icon" aria-hidden>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </span>

        {/* Copy */}
        <h2 className="cancel-modal__title">Payment not completed</h2>
        <p className="cancel-modal__subtitle">
          Your payment wasn't completed and you haven't been charged. You can
          pick a plan and try again whenever you're ready.
        </p>

        {/* Actions */}
        <div className="cancel-modal__actions">
          <button
            className="cancel-modal__cta"
            onClick={() => closeModal(() => setIsPricingModalOpen(true))}
          >
            Choose a plan
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

          <button
            className="cancel-modal__skip"
            onClick={() => closeModal()}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;
