import { Link } from 'react-router-dom';
import './Support.scss';

// mattdigging.com/support: contact and common questions. Used as the Support URL in
// App Store Connect and Google Play, so keep the contact email visible and the answers
// in sync with what the website and app actually do.
const CONTACT_EMAIL = 'mattdigging@gmx.de';

const FAQ: { question: string; answer: React.ReactNode }[] = [
  {
    question: 'How do I create an account or log in?',
    answer: (
      <>
        In the app, open the <strong>Profile</strong> tab and tap <strong>Log in</strong> or{' '}
        <strong>Create an account</strong>. On the website, use <strong>Log in</strong> at the top right. After signing up, confirm
        your email address with the link we send you, then log in.
      </>
    ),
  },
  {
    question: 'I forgot my password',
    answer: (
      <>
        On the login screen, tap <strong>Forgot password?</strong> and enter your email address. We will send you a
        link to choose a new password.
      </>
    ),
  },
  {
    question: 'What does membership include?',
    answer: (
      <>
        Members can listen to the full archive: every weekly selection, all playlists, Hidden Gems and every artist.
        Without a membership you can still explore the app and listen to a preview of the collection.
      </>
    ),
  },
  {
    question: 'How do I manage or cancel my membership?',
    answer: (
      <>
        Log in on mattdigging.com, open your <strong>Profile</strong> and use the settings button next to your
        subscription. After cancelling, you keep access until the end of the period you have already paid for.
      </>
    ),
  },
  {
    question: 'How do I delete my account?',
    answer: (
      <>
        In the app, go to <strong>Profile → Delete account</strong>. This permanently deletes your account and your
        favourites. You can also write to us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will do
        it for you.
      </>
    ),
  },
  {
    question: 'A song does not play',
    answer: (
      <>
        Check your internet connection and that you are logged in. Some songs are for members only: if you see
        “Members only”, log in with a member account. If it still does not work, write to us and tell us which song.
      </>
    ),
  },
  {
    question: 'Can I try the app before it is released?',
    answer: (
      <>
        Yes. Follow the steps for <Link to="/android">Android</Link> or <Link to="/ios">iPhone</Link>.
      </>
    ),
  },
];

const Support = () => (
  <div className="support">
    <nav className="support__nav">
      <Link to="/" aria-label="Mattdigging home">
        <img src="/svg/logo-color.svg" alt="Matt Digging" />
      </Link>
    </nav>

    <header className="support__header">
      <p className="support__label">Support</p>
      <h1 className="support__title">How can we help?</h1>
      <p className="support__intro">Questions about the app, your account or your membership? Write to us, we are happy to help.</p>
    </header>

    <section className="support__contact" aria-label="Contact">
      <div>
        <h2 className="support__contact__title">Contact us</h2>
        <p className="support__contact__email">{CONTACT_EMAIL}</p>
      </div>
      <a className="support__button" href={`mailto:${CONTACT_EMAIL}?subject=Mattdigging%20support`}>
        Write to us
      </a>
    </section>

    <section aria-label="Frequently asked questions">
      <h2 className="support__section">Frequently asked questions</h2>
      <div className="support__faq">
        {FAQ.map(({ question, answer }) => (
          <details key={question} className="support__faq__item">
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>

    <footer className="support__footer">
      <Link to="/privacy">Privacy Policy</Link>
      <Link to="/terms">Terms &amp; Conditions</Link>
    </footer>
  </div>
);

export default Support;
