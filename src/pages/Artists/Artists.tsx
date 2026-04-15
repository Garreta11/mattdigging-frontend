import "./Artists.scss";
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { fetchArtists, Artist } from '../../services/api';
import ImageStorage from "../../components/ImageStorage/ImageStorage";
import { lenis } from '../../index';
import MembersOnly from "../../components/MembersOnly/MembersOnly";

const ArtistItem = ({ artist, onClick, hidden }: { artist: Artist; onClick: () => void; hidden?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="artists__content__artistItem">
      <p className={`artists__content__artistName${hidden ? ' artists__content__artistName--hidden' : ''}`} onClick={onClick}>{artist.name}</p>
      {visible && (
        <ImageStorage
          bucket="artist_photos"
          path={artist.photo_url}
          alt={artist.name}
          className="artists__content__artistImage"
        />
      )}
    </div>
  );
};

const Artists = () => {
  const { setModalArtist, setIsModalArtistOpen, isMember, setIsPricingModalOpen, user } = useAppContext();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadArtists = async () => {
      try {
        setIsLoading(true);
        const data = await fetchArtists();
        setArtists(data);
      } catch (err) {
        console.error('Error loading artists:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtists();
  }, []);

  const groupedArtists = artists.reduce((acc, artist) => {
    const letter = artist.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(artist);
    return acc;
  }, {} as Record<string, Artist[]>);

  const availableLetters = Object.keys(groupedArtists).sort();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`artist-letter-${letter}`);
    if (!el) return;
  
    if (lenis) {
      lenis.scrollTo(el, { offset: -100, immediate: false });
    } else {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleClick = (artist: Artist) => {
    setModalArtist(artist);
    setIsModalArtistOpen(true);
  };

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <section className={`artists main-content ${isFadingOut ? 'fade-out' : ''}`}>

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

      {isMember ? (
        <div className="artists__content">
          <div className="artists__mobile__alphabet">
            <nav className="artists__mobile__alphabet__letters">
              {alphabet.map((letter) => (
                <span
                  key={letter}
                  className={`artists__alphabet__letter ${availableLetters.includes(letter) ? "artists__alphabet__letter--active" : "artists__alphabet__letter--disabled"}`}
                  onClick={() => availableLetters.includes(letter) && scrollToLetter(letter)}
                >
                  {letter}
                </span>
              ))}
            </nav>
          </div>
          <div className="artists__content__artistsList">
            {availableLetters.map((letter) => (
              <div key={letter} id={`artist-letter-${letter}`} className="artists__content__letterGroup">
                <span className="artists__content__letterGroup__label">{letter}</span>
                {groupedArtists[letter].map((artist) => (
                  <ArtistItem
                    key={artist.id}
                    artist={artist}
                    onClick={() => handleClick(artist)}
                  />
                ))}
              </div>
            ))}
          </div>

          {createPortal(
            <nav className="artists__alphabet">
              {alphabet.map((letter) => (
                <span
                  key={letter}
                  className={`artists__alphabet__letter ${availableLetters.includes(letter) ? "artists__alphabet__letter--active" : "artists__alphabet__letter--disabled"}`}
                  onClick={() => availableLetters.includes(letter) && scrollToLetter(letter)}
                >
                  {letter}
                </span>
              ))}
            </nav>
          , document.body)}
        </div>
      ) : (
        <>
          <p className="artists__preview-notice">
            A glimpse into the archive. Become a member to explore every artist.
          </p>
          <button
            className="artists__subscribe-btn"
            onClick={() => user ? setIsPricingModalOpen(true) : navigate('/login')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {user ? 'Become a member' : 'Log in'}
          </button>
          <div className="artists__content">
            <div className="artists__mobile__alphabet">
              <nav className="artists__mobile__alphabet__letters">
                {alphabet.map((letter) => (
                  <span
                    key={letter}
                    className={`artists__alphabet__letter ${availableLetters.includes(letter) ? "artists__alphabet__letter--active" : "artists__alphabet__letter--disabled"}`}
                    onClick={() => availableLetters.includes(letter) && scrollToLetter(letter)}
                  >
                    {letter}
                  </span>
                ))}
              </nav>
            </div>
            <div className="artists__content__artistsList">
              {availableLetters.map((letter) => (
                <div key={letter} id={`artist-letter-${letter}`} className="artists__content__letterGroup">
                  <span className="artists__content__letterGroup__label">{letter}</span>
                  {groupedArtists[letter].map((artist) => (
                    <ArtistItem
                      key={artist.id}
                      artist={artist}
                      onClick={() => null}
                      hidden
                    />
                  ))}
                </div>
              ))}
            </div>

            {createPortal(
              <nav className="artists__alphabet">
                {alphabet.map((letter) => (
                  <span
                    key={letter}
                    className={`artists__alphabet__letter ${availableLetters.includes(letter) ? "artists__alphabet__letter--active" : "artists__alphabet__letter--disabled"}`}
                    onClick={() => availableLetters.includes(letter) && scrollToLetter(letter)}
                  >
                    {letter}
                  </span>
                ))}
              </nav>
            , document.body)}
          </div>
        </>
      )}

    </section>
  );
};

export default Artists;