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
        <button className="main-content__close__button" onClick={handleClose}>
          <FiX size={24} />
        </button>
      </div>
      <div className="about__content">
        <div className="about__content__image">
          <img src="/about.JPEG" alt="About" />
        </div>
        <div className="textContainer" ref={textContainerRef}>
          <div className="textBox">
            <div className="textBox__content" ref={textRef}>
              <p>
              welcome dear music lovers and listeners,
              <br/>
              happy you found your way into this space of vintage sounds with soul. hand-picked gems, curated by a digging nerd. want to pay homage with this site to musical heritage from all over the world, giving your heart and ears some great variety of emotions, impressions and love. this living room can be your space and helper for any mood and emotional state you might be in.
              </p>

              <p>
              get a deep look into my collection. over the past two decades i gathered thousands and thousands of sweet tracks, coming from 1500 records and endless other releases. now it's a good time to share those goodies with each other.
              <br/>
              a lush and infinite source of digging pleasure is waiting for you to be discovered, with one new selection adding up to the library each week (happy sundays).
              <br/>
              a constantly evolving collection of moods and genres will be accessible through plenty of different playlists and weekly selections. also, if you pay attention, you can discover all sorts of musical obscurities.
              </p>

              <p>
              sit back, relax and enjoy the dive into the wonderful world of sounds, curated by a music enthusiast.
              <br/>
              much love,
              <br/>
              <br/>
              Matti / mattmosphere
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;