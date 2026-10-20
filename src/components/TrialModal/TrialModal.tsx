import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { fetchBillingCheckout } from '../../services/api';
import './TrialModal.scss';

// Stripe coupon for the one-month-free welcome offer (also applied server-side).
const TRIAL_CODE = 'EWPTDCQM';

const FEATURES = [
  'Full access to the entire track library',
  'Hidden Gems — exclusive rare finds',
  'Weekly curated selections',
  'Cancel anytime before your month ends — no charge',
];

const TrialModal = () => {
  const { isTrialModalOpen, setIsTrialModalOpen, setIsPricingModalOpen, initializeAuth } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTrialModalOpen) return;

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
        '.trial-modal__eyebrow, .trial-modal__title, .trial-modal__subtitle',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.45, ease: 'power2.out' },
        '-=0.3'
      )
      .fromTo(
        '.trial-modal__code',
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' },
        '-=0.2'
      )
      .fromTo(
        '.trial-modal__feature',
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.07, duration: 0.35, ease: 'power2.out' },
        '-=0.25'
      );
  }, [isTrialModalOpen]);

  // Lock background scroll while open so the overlay is the only scroll surface.
  useEffect(() => {
    if (!isTrialModalOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isTrialModalOpen]);

  const closeModal = (callback?: () => void) => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsTrialModalOpen(false);
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(TRIAL_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the code is still visible to copy by hand.
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Your session has expired. Please log in again and retry.');
        return;
      }
      const { url } = await fetchBillingCheckout(token, initializeAuth, 'monthly', true);
      if (url) {
        // Same-tab redirect (see PricingModal: iOS Safari blocks async popups).
        setIsTrialModalOpen(false);
        window.location.assign(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isTrialModalOpen) return null;

  return (
    <div
      className="trial-modal-overlay"
      ref={overlayRef}
      onClick={() => closeModal()}
      data-lenis-prevent
    >
      <div
        className="trial-modal"
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="trial-modal__close"
          onClick={() => closeModal()}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="trial-modal__header">
          <span className="trial-modal__eyebrow">Welcome gift</span>
          <h2 className="trial-modal__title">Your first month is on us.</h2>
          <p className="trial-modal__subtitle">
            Thanks for joining. Dig through the whole library free for one month —
            then €5.00/month, or cancel anytime from your profile.
          </p>
        </div>

        {/* Code */}
        <div className="trial-modal__code">
          <span className="trial-modal__code__label">Your 1-month-free code</span>
          <div className="trial-modal__code__row">
            <span className="trial-modal__code__value">{TRIAL_CODE}</span>
            <button
              type="button"
              className="trial-modal__code__copy"
              onClick={handleCopy}
              aria-label="Copy code"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <span className="trial-modal__code__hint">
            Applied automatically at checkout. If not, paste it in the promotion code field.
          </span>
        </div>

        {/* Features */}
        <ul className="trial-modal__features">
          {FEATURES.map((f) => (
            <li key={f} className="trial-modal__feature">
              <span className="trial-modal__feature__check" aria-hidden>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* Error */}
        {error && <p className="trial-modal__error">{error}</p>}

        {/* CTA */}
        <button className="trial-modal__cta" onClick={handleStartTrial} disabled={loading}>
          {loading ? (
            <span className="trial-modal__cta__spinner" />
          ) : (
            <>
              Start my free month
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>

        <button
          className="trial-modal__skip"
          onClick={() => closeModal(() => setIsPricingModalOpen(true, { skipTrial: true }))}
        >
          See all plans
        </button>
      </div>
    </div>
  );
};

export default TrialModal;
