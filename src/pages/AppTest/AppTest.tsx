import { Link } from 'react-router-dom';
import './AppTest.scss';

// Short links to share with app testers: mattdigging.com/android and mattdigging.com/ios.
// Each page walks a tester through joining the beta, with one button per step.

// Android: closed test on Google Play. Testers join the Google Group first; only group
// members can accept the test.
const ANDROID_GROUP_URL = 'https://groups.google.com/g/mattdigging-testers';
const ANDROID_OPT_IN_URL = 'https://play.google.com/apps/testing/com.mattdigging.app';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mattdigging.app';

// iOS: TestFlight. The public link comes from App Store Connect → TestFlight → an external
// testing group → Public Link. Until it is set, the page asks people to email for an invite.
const IOS_TESTFLIGHT_PUBLIC_URL = 'https://testflight.apple.com/join/Se3GYqNQ';
const TESTFLIGHT_APP_URL = 'https://apps.apple.com/app/testflight/id899247664';
const CONTACT_EMAIL = 'mattdigging@gmx.de';

type Step = { title: string; text: string; button?: { label: string; href: string } };

type Platform = 'android' | 'ios';

const PAGES: Record<Platform, { title: string; intro: string; steps: Step[]; notes: string[] }> = {
  android: {
    title: 'Try the app on Android',
    intro: 'The Mattdigging app is in testing on Google Play. Three steps and you are in.',
    steps: [
      {
        title: 'Join the testers group',
        text: 'Sign in with the Google account you use on your phone and tap “Join group”.',
        button: { label: 'Join the group', href: ANDROID_GROUP_URL },
      },
      {
        title: 'Become a tester',
        text: 'Accept the invitation to test Mattdigging, with the same Google account.',
        button: { label: 'Become a tester', href: ANDROID_OPT_IN_URL },
      },
      {
        title: 'Install the app',
        text: 'Download Mattdigging from Google Play. Updates arrive like for any other app.',
        button: { label: 'Get it on Google Play', href: ANDROID_STORE_URL },
      },
    ],
    notes: [
      'Use the same Google account in all three steps and in the Play Store on your phone.',
      'If Google Play says “Item not found”, wait a few minutes after joining and try again.',
    ],
  },
  ios: {
    title: 'Try the app on iPhone',
    intro: 'The Mattdigging app is in testing on TestFlight, Apple’s app for trying apps before they are released.',
    steps: IOS_TESTFLIGHT_PUBLIC_URL
      ? [
          {
            title: 'Install TestFlight',
            text: 'Get Apple’s free TestFlight app from the App Store.',
            button: { label: 'Get TestFlight', href: TESTFLIGHT_APP_URL },
          },
          {
            title: 'Open the invitation',
            text: 'Open this link on your iPhone and tap “Accept”.',
            button: { label: 'Join the beta', href: IOS_TESTFLIGHT_PUBLIC_URL },
          },
          {
            title: 'Install the app',
            text: 'Tap “Install” in TestFlight. New versions show up there too.',
          },
        ]
      : [
          {
            title: 'Install TestFlight',
            text: 'Get Apple’s free TestFlight app from the App Store.',
            button: { label: 'Get TestFlight', href: TESTFLIGHT_APP_URL },
          },
          {
            title: 'Ask for an invitation',
            text: 'Send us the email address of your Apple ID and we will invite you.',
            button: { label: 'Email us', href: `mailto:${CONTACT_EMAIL}?subject=Mattdigging%20iPhone%20beta` },
          },
          {
            title: 'Install the app',
            text: 'Open the invitation email on your iPhone, then tap “Install” in TestFlight.',
          },
        ],
    notes: ['Open the links on the iPhone where you want to use the app.'],
  },
};

const AppTest = ({ platform }: { platform: Platform }) => {
  const page = PAGES[platform];

  return (
    <div className="appTest">
      <nav className="appTest__nav">
        <Link to="/" aria-label="Mattdigging home">
          <img src="/svg/logo-color.svg" alt="Matt Digging" />
        </Link>
      </nav>

      <header className="appTest__header">
        <p className="appTest__label">Beta</p>
        <h1 className="appTest__title">{page.title}</h1>
        <p className="appTest__intro">{page.intro}</p>
      </header>

      <ol className="appTest__steps">
        {page.steps.map((step, i) => (
          <li key={step.title} className="appTest__step">
            <span className="appTest__step__number">{i + 1}</span>
            <div className="appTest__step__body">
              <h2 className="appTest__step__title">{step.title}</h2>
              <p className="appTest__step__text">{step.text}</p>
              {step.button && (
                <a className="appTest__button" href={step.button.href} target="_blank" rel="noopener noreferrer">
                  {step.button.label}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <ul className="appTest__notes">
        {page.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <p className="appTest__other">
        {platform === 'android' ? (
          <>On an iPhone? <Link to="/ios">Try it on iOS</Link></>
        ) : (
          <>On Android? <Link to="/android">Try it on Android</Link></>
        )}
      </p>
    </div>
  );
};

export default AppTest;
