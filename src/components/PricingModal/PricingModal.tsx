import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { fetchBillingCheckout } from '../../services/api';
import './PricingModal.scss';

const FEATURES = [
  'Full access to the entire track library',
  'Hidden Gems — exclusive rare finds',
  'Weekly curated selections',
  'Support independent music discovery',
];

const PricingModal = () => {
  const { isPricingModalOpen, setIsPricingModalOpen, initializeAuth } = useAppContext();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLUListElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPricingModalOpen) return;

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
        '.pricing-modal__eyebrow, .pricing-modal__title, .pricing-modal__subtitle',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.45, ease: 'power2.out' },
        '-=0.3'
      )
      .fromTo(
        '.pricing-modal__feature',
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.07, duration: 0.35, ease: 'power2.out' },
        '-=0.2'
      )
      .fromTo(
        '.pricing-modal__plan',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, ease: 'power2.out' },
        '-=0.35'
      )
      .fromTo(
        '.pricing-modal__skip',
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        '-=0.1'
      );
  }, [isPricingModalOpen]);

  // Lock background scroll while open (mirrors TrackModal) so the overlay is
  // the only scroll surface — prevents double-scroll/rubber-band on mobile.
  useEffect(() => {
    if (!isPricingModalOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPricingModalOpen]);

  const closeModal = (callback?: () => void) => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsPricingModalOpen(false);
        callback?.();
      },
    });
    tl.to(contentRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    }).to(
      overlayRef.current,
      { opacity: 0, duration: 0.25 },
      '-=0.1'
    );
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const { url } = await fetchBillingCheckout(token, initializeAuth, selectedPlan);
      if (url) {
        // Same-tab redirect. window.open('_blank') after an await (and from a
        // GSAP callback) is blocked by iOS Safari's popup blocker — it only
        // allows popups synchronously inside a user gesture. Stripe Checkout
        // returns to the app via its success/cancel URLs.
        setIsPricingModalOpen(false);
        window.location.assign(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isPricingModalOpen) return null;

  const monthlyPrice = 5.00;
  const annualPrice = 50.00;
  const annualMonthly = (annualPrice / 12).toFixed(2);
  const savingPct = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);

  return (
    <div
      className="pricing-modal-overlay"
      ref={overlayRef}
      onClick={() => closeModal()}
      data-lenis-prevent
    >
      <div
        className="pricing-modal"
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="pricing-modal__close"
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

        {/* Header */}
        <div className="pricing-modal__header">
          <span className="pricing-modal__eyebrow">Membership</span>
          <h2 className="pricing-modal__title">Unlock the full digging experience.</h2>
          <p className="pricing-modal__subtitle">
            Get unlimited access to every track we've ever unearthed.
          </p>
        </div>

        {/* Features */}
        <ul className="pricing-modal__features" ref={featuresRef}>
          {FEATURES.map((f) => (
            <li key={f} className="pricing-modal__feature">
              <span className="pricing-modal__feature__check" aria-hidden>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* Plans */}
        <div className="pricing-modal__plans" ref={plansRef}>
          {/* Monthly */}
          <div
            className={`pricing-modal__plan ${selectedPlan === 'monthly' ? 'pricing-modal__plan--selected' : ''}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="pricing-modal__plan__label">Monthly</div>
            <div className="pricing-modal__plan__price">
              <span className="pricing-modal__plan__currency">€</span>
              <span className="pricing-modal__plan__amount">{monthlyPrice.toFixed(2)}</span>
            </div>
            <div className="pricing-modal__plan__period">per month</div>
            <div className="pricing-modal__plan__billing">Billed monthly</div>
          </div>

          {/* Annual */}
          <div
            className={`pricing-modal__plan pricing-modal__plan--annual ${selectedPlan === 'annual' ? 'pricing-modal__plan--selected' : ''}`}
            onClick={() => setSelectedPlan('annual')}
          >
            <div className="pricing-modal__plan__badge">Save {savingPct}%</div>
            <div className="pricing-modal__plan__label">Annual</div>
            <div className="pricing-modal__plan__price">
              <span className="pricing-modal__plan__currency">€</span>
              <span className="pricing-modal__plan__amount">{annualMonthly}</span>
            </div>
            <div className="pricing-modal__plan__period">per month</div>
            <div className="pricing-modal__plan__billing">€{annualPrice.toFixed(2)} billed annually</div>
          </div>
        </div>

        {/* Error */}
        {error && <p className="pricing-modal__error">{error}</p>}

        {/* CTA */}
        <button
          className="pricing-modal__cta"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <span className="pricing-modal__cta__spinner" />
          ) : (
            <>
              Get {selectedPlan === 'annual' ? 'Annual' : 'Monthly'} Access
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
            </>
          )}
        </button>

        <button className="pricing-modal__skip" onClick={() => closeModal()}>
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default PricingModal;
