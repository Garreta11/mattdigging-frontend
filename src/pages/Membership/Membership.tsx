import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import CloseButton from "../../components/CloseButton/CloseButton";
import { useAppContext } from "../../context/AppContext";
import { supabase } from "../../lib/supabase";
import { fetchBillingCheckout, fetchBillingPortal } from "../../services/api";
import "./Membership.scss";

// One page for everything membership: the free-month offer, the plans, or managing an
// active subscription. Linkable (e.g. from the mobile app once the stores allow it, or emails),
// unlike the Trial/Pricing modals.

// Same coupon as TrialModal (also applied server-side).
const TRIAL_CODE = "EWPTDCQM";

const FEATURES = [
  "Full access to the entire track library",
  "Hidden Gems — exclusive rare finds",
  "Weekly curated selections",
  "Support independent music discovery",
];

const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const Membership = () => {
  const navigate = useNavigate();
  const { user, auth, isMember, authReady } = useAppContext();
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate("/"), 1000);
  };

  const trialUsed = auth?.profile?.trial_used === true;

  return (
    <section className={`membership main-content ${isFadingOut ? "fade-out" : ""}`}>
      <CloseButton onClick={handleClose} />

      <div className="membership__inner">
        {!authReady ? null : !user ? (
          <LoggedOut />
        ) : isMember ? (
          <ActiveMembership />
        ) : !trialUsed ? (
          <TrialOffer />
        ) : (
          <Plans />
        )}
      </div>
    </section>
  );
};

function Header({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <header className="membership__header">
      <span className="membership__eyebrow">{eyebrow}</span>
      <h1 className="membership__title">{title}</h1>
      <p className="membership__subtitle">{subtitle}</p>
    </header>
  );
}

function Features() {
  return (
    <ul className="membership__features">
      {FEATURES.map((f) => (
        <li key={f} className="membership__feature">
          <span className="membership__feature__check" aria-hidden>
            <FiCheck size={13} />
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function CtaButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button type="button" className="membership__cta" onClick={onClick} disabled={loading}>
      {loading ? (
        <span className="membership__spinner" />
      ) : (
        <>
          {label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </>
      )}
    </button>
  );
}

// Starts a Stripe Checkout and redirects there in the same tab
// (iOS Safari blocks window.open after an await).
function useCheckout() {
  const { initializeAuth } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (plan: "monthly" | "annual", trial = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Your session has expired. Please log in again and retry.");
        return;
      }
      const { url } = await fetchBillingCheckout(token, initializeAuth, plan, trial);
      if (url) window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { start, loading, error };
}

function LoggedOut() {
  const navigate = useNavigate();
  return (
    <>
      <Header
        eyebrow="Membership"
        title="Unlock the full digging experience."
        subtitle="New members get their first month free. Log in or create an account to start."
      />
      <Features />
      <CtaButton label="Log in or sign up" loading={false} onClick={() => navigate("/login")} />
    </>
  );
}

function TrialOffer() {
  const { setIsPricingModalOpen } = useAppContext();
  const { start, loading, error } = useCheckout();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(TRIAL_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the code is still visible to copy by hand.
    }
  };

  return (
    <>
      <Header
        eyebrow="Welcome gift"
        title="Your first month is on us."
        subtitle="Dig through the whole library free for one month — then €5.00/month, or cancel anytime from your profile."
      />

      <div className="membership__code">
        <span className="membership__code__label">Your 1-month-free code</span>
        <div className="membership__code__row">
          <span className="membership__code__value">{TRIAL_CODE}</span>
          <button type="button" className="membership__code__copy" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <span className="membership__code__hint">
          Applied automatically at checkout. If not, paste it in the promotion code field.
        </span>
      </div>

      <Features />

      {error && <p className="membership__error">{error}</p>}
      <CtaButton label="Start my free month" loading={loading} onClick={() => start("monthly", true)} />
      <button
        type="button"
        className="membership__link"
        onClick={() => setIsPricingModalOpen(true, { skipTrial: true })}
      >
        See all plans
      </button>
    </>
  );
}

function Plans() {
  const { start, loading, error } = useCheckout();
  const [selected, setSelected] = useState<"monthly" | "annual">("annual");

  const monthlyPrice = 5.0;
  const annualPrice = 50.0;
  const savingPct = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);

  return (
    <>
      <Header
        eyebrow="Membership"
        title="Unlock the full digging experience."
        subtitle="Get unlimited access to every track we've ever unearthed."
      />
      <Features />

      <div className="membership__plans">
        <button
          type="button"
          className={`membership__plan ${selected === "monthly" ? "membership__plan--selected" : ""}`}
          onClick={() => setSelected("monthly")}
        >
          <span className="membership__plan__label">Monthly</span>
          <span className="membership__plan__amount">€{monthlyPrice.toFixed(2)}</span>
          <span className="membership__plan__period">per month · billed monthly</span>
        </button>
        <button
          type="button"
          className={`membership__plan membership__plan--annual ${selected === "annual" ? "membership__plan--selected" : ""}`}
          onClick={() => setSelected("annual")}
        >
          <span className="membership__plan__badge">Save {savingPct}%</span>
          <span className="membership__plan__label">Annual</span>
          <span className="membership__plan__amount">€{(annualPrice / 12).toFixed(2)}</span>
          <span className="membership__plan__period">per month · €{annualPrice.toFixed(2)} billed annually</span>
        </button>
      </div>

      {error && <p className="membership__error">{error}</p>}
      <CtaButton
        label={`Get ${selected === "annual" ? "Annual" : "Monthly"} Access`}
        loading={loading}
        onClick={() => start(selected)}
      />
    </>
  );
}

function ActiveMembership() {
  const { auth } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profile = auth?.profile;
  const plan: string | null = profile?.subscription_type ?? null;

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const { url } = await fetchBillingPortal(token);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the billing portal.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        eyebrow="Membership"
        title="You're a member."
        subtitle="The full library is yours to explore. Change your plan, update your payment method or cancel anytime."
      />

      <dl className="membership__details">
        <div>
          <dt>Plan</dt>
          <dd>{plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)}` : "Member"}</dd>
        </div>
        {profile?.subscription_expires_at && (
          <div>
            <dt>Current period ends</dt>
            <dd>{formatDate(profile.subscription_expires_at)}</dd>
          </div>
        )}
        {profile?.member_since && (
          <div>
            <dt>Member since</dt>
            <dd>{formatDate(profile.member_since)}</dd>
          </div>
        )}
      </dl>

      {error && <p className="membership__error">{error}</p>}
      <CtaButton label="Manage subscription" loading={loading} onClick={openPortal} />
    </>
  );
}

export default Membership;
