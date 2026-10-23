// One build, two sites:
// - mattdigging.com (and www): the landing page, plus the legal, support and app-tester pages.
// - play.mattdigging.com: the web app. Any other path on the landing site is sent there,
//   so old links (/profile, /membership, /auth/confirm…) keep working. Routes: index.tsx.
// Locally the web app runs; start with REACT_APP_SITE=landing to see the landing page.

const LANDING_HOSTS = ['mattdigging.com', 'www.mattdigging.com'];

export const IS_LANDING_SITE =
  process.env.REACT_APP_SITE === 'landing' || LANDING_HOSTS.includes(window.location.hostname);

export const PLAY_URL = (process.env.REACT_APP_PLAY_URL || 'https://play.mattdigging.com').replace(/\/+$/, '');

export const CONTACT_EMAIL = 'mattdigging@gmx.de';

// Store links. Until the apps are released, the landing page says "Beta on" and links
// to the tester pages (/ios, /android) instead. Flip to true once both are live.
export const APPS_RELEASED = false;
export const APP_STORE_URL = 'https://apps.apple.com/app/id6825697215';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mattdigging.app';
