import "./Artists.scss";
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { fetchArtists, Artist } from '../../services/api';
import ImageStorage from "../../components/ImageStorage/ImageStorage";
import { lenis } from '../../index';
import Loader from "../../components/Loader/Loader";
import CloseButton from "../../components/CloseButton/CloseButton";

// The photo shown when hovering a name is 300px, so 600px keeps it sharp on retina screens.
// The originals are ~1.7 MB PNGs; this resized WebP is ~20 KB.
const ARTIST_PHOTO_SIZE = 600;

const ArtistItem = ({ artist, onClick, hidden }: { artist: Artist; onClick: () => void; hidden?: boolean }) => {
  // Load the photo only when the pointer enters this artist's row (just before it reaches
  // the name), not for every artist that scrolls into view: otherwise dozens of downloads
  // queue up and the photo you are hovering arrives last. Once loaded, it stays.
  const [wantPhoto, setWantPhoto] = useState(false);

  return (
    <div className="artists__content__artistItem" onMouseEnter={() => setWantPhoto(true)}>
      <p className={`artists__content__artistName${hidden ? ' artists__content__artistName--hidden' : ''}`} onClick={onClick}>{artist.name}</p>
      {wantPhoto && (
        <ImageStorage
          bucket="artist_photos"
          path={artist.photo_url}
          alt={artist.name}
          className="artists__content__artistImage"
          size={ARTIST_PHOTO_SIZE}
        />
      )}
    </div>
  );
};

const Artists = () => {
  const { setModalArtist, setIsModalArtistOpen, isMember, setIsPricingModalOpen, user, authReady } = useAppContext();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  // Treat unresolved subscription status as loading so membership UI never flashes
  const isLoading = dataLoading || !authReady;
  const [isFadingOut, setIsFadingOut] = useState(false);

  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadArtists = async () => {
      try {
        setDataLoading(true);
        const data = await fetchArtists();
        setArtists(data);
      } catch (err) {
        console.error('Error loading artists:', err);
      } finally {
        setDataLoading(false);
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

  return (
    <section className={`artists main-content ${isFadingOut ? 'fade-out' : ''}`}>

      <CloseButton onClick={handleClose} />

      {isLoading && <Loader />}

      {!isLoading && isMember ? (
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
      ) : !isLoading && (
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