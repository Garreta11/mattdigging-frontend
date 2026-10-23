import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { FiArrowUpRight, FiHeart, FiLock, FiShuffle, FiSmartphone } from 'react-icons/fi';
import {
  APPS_RELEASED,
  APP_STORE_URL,
  CONTACT_EMAIL,
  PLAY_STORE_URL,
  PLAY_URL,
} from '../../lib/site';
import './Landing.scss';

// mattdigging.com: what the project is, where to listen (web app, iPhone, Android) and what a
// membership includes. The web app itself lives on play.mattdigging.com (see lib/site.ts).

// Same prices as the Membership page.
const MONTHLY_PRICE = 5;
const ANNUAL_PRICE = 50;

const INSIDE = [
  {
    title: 'Weekly Selections',
    text: 'Every Sunday a new selection of ten hand-picked songs joins the library. Happy Sundays!',
  },
  {
    title: 'Playlists',
    text: 'Dig by mood, country or genre: from French chanson to Spanish funk, from late-night chill to pure energy.',
  },
  {
    title: 'Hidden Gems',
    text: 'The rarest finds of the collection, the musical obscurities you will not hear anywhere else.',
  },
  {
    title: 'Artists A–Z',
    text: 'Browse every artist in the archive, from household names to forgotten heroes.',
  },
];

const APP_FEATURES = [
  { icon: <FiSmartphone />, text: 'Keeps playing in the background, with controls on the lock screen' },
  { icon: <FiHeart />, text: 'Save your favourites, the same on the app and the website' },
  { icon: <FiShuffle />, text: 'Shuffle a whole playlist or let the archive surprise you' },
  { icon: <FiLock />, text: 'Sign in with email, Google or Apple' },
];

const FAQ = [
  {
    question: 'Can I listen for free?',
    answer:
      'Yes. Create a free account to explore the living room and listen to a preview of the collection. A membership unlocks the full archive.',
  },
  {
    question: 'Where can I listen?',
    answer:
      'In your browser on play.mattdigging.com, and in the Mattdigging app for iPhone and Android. One account works everywhere.',
  },
  {
    question: 'How does the free month work?',
    answer: `Your first month of membership is free. After that it is €${MONTHLY_PRICE.toFixed(2)} per month, or €${ANNUAL_PRICE.toFixed(2)} per year. You can cancel anytime from your profile.`,
  },
  {
    question: 'Can I get a membership in the app?',
    answer:
      'Memberships are started on the website. Once you are a member, just log in to the app with the same account.',
  },
];

// App Store / Google Play buttons. Before release they point to the beta pages.
const StoreButtons = () => (
  <div className="landing__stores">
    <a className="landing__store" href={APPS_RELEASED ? APP_STORE_URL : '/ios'}>
      <FaApple className="landing__store__icon" aria-hidden />
      <span>
        <small>{APPS_RELEASED ? 'Download on the' : 'Beta on'}</small>
        App Store
      </span>
    </a>
    <a className="landing__store" href={APPS_RELEASED ? PLAY_STORE_URL : '/android'}>
      <FaGooglePlay className="landing__store__icon" aria-hidden />
      <span>
        <small>{APPS_RELEASED ? 'Get it on' : 'Beta on'}</small>
        Google Play
      </span>
    </a>
  </div>
);

const Landing = () => {
  useEffect(() => {
    document.title = 'Mattdigging · Vintage sounds with soul';
    return () => {
      document.title = 'Mattdigging';
    };
  }, []);

  return (
    <div className="landing">
      <nav className="landing__nav">
        <a href="#top" aria-label="Mattdigging">
          <img src="/svg/logo-color.svg" alt="Mattdigging" />
        </a>
        <div className="landing__nav__links">
          <a href="#inside">Inside</a>
          <a href="#about">About</a>
          <a href="#app">App</a>
          <a href="#membership">Membership</a>
        </div>
        <a className="landing__button landing__button--small" href={PLAY_URL}>
          Open web app
        </a>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <header id="top" className="landing__hero">
        <img className="landing__hero__image" src="/landing/header.webp" alt="" />
        <div className="landing__hero__content">
          <p className="landing__label">Curated by Matti · mattmosphere</p>
          <h1 className="landing__hero__title">Vintage sounds with soul</h1>
          <p className="landing__hero__text">
            Thousands of hand-picked tracks from two decades of digging, and a new selection every Sunday.
          </p>
          <div className="landing__hero__actions">
            <a className="landing__button" href={PLAY_URL}>
              Listen on the web <FiArrowUpRight aria-hidden />
            </a>
            <StoreButtons />
          </div>
          {!APPS_RELEASED && <p className="landing__note">The apps are in beta: join now and get every update.</p>}
        </div>
      </header>

      <section className="landing__stats" aria-label="The collection in numbers">
        <div>
          <strong>20+</strong>
          <span>years of digging</span>
        </div>
        <div>
          <strong>1500+</strong>
          <span>records in the collection</span>
        </div>
        <div>
          <strong>10</strong>
          <span>new songs every Sunday</span>
        </div>
      </section>

      {/* ── What's inside ──────────────────────────────────── */}
      <section id="inside" className="landing__section">
        <p className="landing__label">What’s inside</p>
        <h2 className="landing__title">A living room full of records</h2>
        <p className="landing__intro">
          Music from all over the world, for any mood you might be in. Sit back, relax and start digging.
        </p>
        <div className="landing__cards">
          {INSIDE.map(({ title, text }, i) => (
            <article key={title} className="landing__card">
              <span className="landing__card__number">{String(i + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Web app ────────────────────────────────────────── */}
      <section className="landing__room">
        <img src="/landing/room.webp" alt="The Mattdigging living room" loading="lazy" />
        <div className="landing__room__text">
          <p className="landing__label">On the web</p>
          <h2 className="landing__title">Step into the living room</h2>
          <p className="landing__intro">
            Open the web app and wander around: the shelf holds the weekly selections, the chest hides the gems,
            and the record player is always on.
          </p>
          <a className="landing__button" href={PLAY_URL}>
            Enter play.mattdigging.com <FiArrowUpRight aria-hidden />
          </a>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────── */}
      <section id="about" className="landing__section landing__about">
        <p className="landing__label">About</p>
        <h2 className="landing__title">Curated by a digging nerd</h2>
        <blockquote>
          Over the past two decades I gathered thousands and thousands of sweet tracks, coming from over 1500
          records and endless other releases. Mattdigging pays homage to musical heritage from all over the
          world. Now it’s time to share those goodies with each other.
        </blockquote>
        <p className="landing__signature">
          Much love,
          <br />
          <span>Matti / mattmosphere</span>
        </p>
      </section>

      {/* ── App ────────────────────────────────────────────── */}
      <section id="app" className="landing__section landing__app">
        <div>
          <p className="landing__label">The app</p>
          <h2 className="landing__title">Take the collection with you</h2>
          <p className="landing__intro">
            Mattdigging for iPhone and Android: the whole archive in your pocket, with the same account as the
            website.
          </p>
          <ul className="landing__features">
            {APP_FEATURES.map(({ icon, text }) => (
              <li key={text}>
                {icon}
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <StoreButtons />
        </div>
        <img className="landing__app__icon" src="/favicon-512.png" alt="Mattdigging app icon" loading="lazy" />
      </section>

      {/* ── Membership ─────────────────────────────────────── */}
      <section id="membership" className="landing__section">
        <p className="landing__label">Membership</p>
        <h2 className="landing__title">Dig through the whole archive</h2>
        <p className="landing__intro">Your first month is free. Cancel anytime.</p>
        <div className="landing__plans">
          <article className="landing__plan">
            <h3>Free account</h3>
            <p className="landing__plan__price">€0</p>
            <ul>
              <li>Explore the living room</li>
              <li>A preview of the collection</li>
              <li>Web, iPhone and Android</li>
            </ul>
            <a className="landing__button landing__button--outline" href={`${PLAY_URL}/login`}>
              Create an account
            </a>
          </article>
          <article className="landing__plan landing__plan--member">
            <h3>Membership</h3>
            <p className="landing__plan__price">
              €{MONTHLY_PRICE.toFixed(2)}
              <small> / month</small>
            </p>
            <p className="landing__plan__alt">or €{ANNUAL_PRICE.toFixed(2)} per year</p>
            <ul>
              <li>Every weekly selection, past and new</li>
              <li>All playlists and Hidden Gems</li>
              <li>Every artist and every track</li>
            </ul>
            <a className="landing__button" href={`${PLAY_URL}/membership`}>
              Start your free month
            </a>
          </article>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="landing__section landing__faq">
        <p className="landing__label">Questions</p>
        <h2 className="landing__title">Good to know</h2>
        <div className="landing__faq__list">
          {FAQ.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <p className="landing__intro">
          Anything else? Visit <Link to="/support">Support</Link> or write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <footer className="landing__footer">
        <img src="/svg/logo-color.svg" alt="Mattdigging" />
        <div className="landing__footer__links">
          <a href={PLAY_URL}>Web app</a>
          <Link to="/support">Support</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
        </div>
        <p>© {new Date().getFullYear()} mattmosphere</p>
      </footer>
    </div>
  );
};

export default Landing;
