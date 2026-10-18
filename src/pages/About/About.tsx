import './About.scss';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseButton from "../../components/CloseButton/CloseButton";


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
      <CloseButton onClick={handleClose} />
      
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