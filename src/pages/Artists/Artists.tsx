import "./Artists.scss";
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { fetchArtists, Artist } from '../../services/api';
import ImageStorage from "../../components/ImageStorage/ImageStorage";
import { lenis } from '../../index';

const ArtistItem = ({ artist, onClick }: { artist: Artist; onClick: () => void }) => {
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
      <p className="artists__content__artistName" onClick={onClick}>{artist.name}</p>
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
  const { user, setModalArtist, setIsModalArtistOpen } = useAppContext();
  const isMember = user?.isMember;

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
          <svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.204244 4.65981C-0.069123 4.93318 -0.069123 5.37639 0.204244 5.64976L4.65902 10.1045C4.93238 10.3779 5.3756 10.3779 5.64897 10.1045C5.92233 9.83117 5.92233 9.38795 5.64897 9.11458L1.68917 5.15479L5.64897 1.19499C5.92233 0.92162 5.92233 0.478405 5.64897 0.205038C5.3756 -0.0683293 4.93238 -0.0683293 4.65902 0.205038L0.204244 4.65981ZM33.8867 5.15479V4.45479H0.699219V5.15479V5.85479H33.8867V5.15479Z" fill="var(--color-white)"/>
          </svg>
        </button>
      </div>

      {!isMember ? (
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
        <div>
          <h2>🔒 Only members can access artist profiles. Log in or join to unlock.</h2>
        </div>
      )}

    </section>
  );
};

export default Artists;