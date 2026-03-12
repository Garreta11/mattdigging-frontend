import './About.scss';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';


const About = () => {
  const navigate = useNavigate();
  const [isFadingOut, setIsFadingOut] = useState(false);

  const textRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);


  const handleClose = () => {
    setIsFadingOut(true);
    
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <section className={`about main-content ${isFadingOut ? 'fade-out' : ''}`} style={{ '--bg-image': `url('/about.JPEG')` } as React.CSSProperties}>
      <div className="main-content__close">
        <button className="main-content__close__button main-content__close__button--reverse" onClick={handleClose}>
          HOME
          <svg width="17" height="6" viewBox="0 0 17 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_47_2)">
              <path d="M16.898 3.1701C17.0347 3.03342 17.0347 2.81181 16.898 2.67513L14.6706 0.447756C14.5339 0.311057 14.3123 0.311057 14.1756 0.447757C14.0389 0.584422 14.0389 0.806031 14.1756 0.942716L16.1555 2.92261L14.1756 4.90251C14.0389 5.0392 14.0389 5.2608 14.1756 5.39749C14.3123 5.53417 14.5339 5.53417 14.6706 5.39749L16.898 3.1701ZM0.0567477 2.92261L0.0567477 3.27261L16.6505 3.27261L16.6505 2.92261L16.6505 2.57261L0.0567477 2.57261L0.0567477 2.92261Z" fill="var(--color-white)"/>
            </g>
            <defs>
            <clipPath id="clip0_47_2">
            <rect width="17" height="5.5" fill="white" transform="translate(17 5.5) rotate(180)"/>
            </clipPath>
            </defs>
          </svg>

        </button>
      </div>
      
      <div className="about__content">
        <div className="about__content__image">
          <img src="/about.JPEG" alt="About" />
        </div>
        <div className="about__content__text" ref={textContainerRef}>
          <div className="about__content__text__box">
            <div className="about__content__text__box__content" ref={textRef}>
              <h1>
              Welcome dear music lovers & listeners,
              </h1>
              <p>
              Happy you found your way into this space of vintage sounds with soul. Hand-picked gems, curated by a digging nerd. Want to pay homage with this site to musical heritage from all over the world, giving your heart and ears some great variety of emotions, impressions and love. This living room can be your space and supporter for any mood and emotional state you might be in.
              </p>

              <p>
              Get a deep look into my collection. Over the past two decades I gathered thousands and thousands of sweet tracks, coming from over 1500 records and endless other releases. Now it's time to share those goodies with each other.
              </p>
              <p>
              A lush and infinite source of digging pleasure is waiting for you to be discovered, with one new selection (containing a playlist of 10 well curated songs) adding up to the library each week. Happy Sundays!
              </p>
              <p>
              A constantly evolving collection of moods, countries and genres will be accessible through plenty of different playlists and weekly selections. Also, if you pay attention, you can discover all sorts of musical obscurities (hidden gems).
              </p>
              <p>
              Sit back, relax and enjoy the dive into the wonderful world of sounds, curated by a music enthusiast.
              </p>
              <p className="italic">
              Much love,
              </p>
              <h3>
              Matti / mattmosphere
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;