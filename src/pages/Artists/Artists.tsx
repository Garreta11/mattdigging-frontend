import "./Artists.scss";
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { fetchArtists, Artist } from '../../services/api';
import ImageStorage from "../../components/ImageStorage/ImageStorage";
import ArtistModal from "../../components/ArtistModal/ArtistModal";

const Artists = () => {
  const { user, modalArtist, setModalArtist, isModalArtistOpen, setIsModalArtistOpen } = useAppContext();
  const isMember = user?.isMember;

  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
        console.log(data);
        setArtists(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artists');
        console.error('Error loading artists:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtists();
  }, []);

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedArtists = filteredArtists.reduce((acc, artist) => {
    const letter = artist.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(artist);
    return acc;
  }, {} as Record<string, Artist[]>);

  const availableLetters = Object.keys(groupedArtists).sort();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`artist-letter-${letter}`);
    if (el) {
      const offset = 0;
      const parent = el.closest('.main-content') as HTMLElement;
      if (parent) {
        const top = el.offsetTop - parent.offsetTop - offset;
        parent.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const handleClick = (artist: Artist) => {
    setModalArtist(artist);
    setIsModalArtistOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalArtistOpen(false);
    setModalArtist(null);
  };

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

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
          <div className="artists__content__artistsList">
            {availableLetters.map((letter) => (
              <div key={letter} id={`artist-letter-${letter}`} className="artists__content__letterGroup">
                <span className="artists__content__letterGroup__label">{letter}</span>
                {groupedArtists[letter].map((artist) => (
                  <div key={artist.id} className="artists__content__artistItem">
                    <p className="artists__content__artistName" onClick={() => handleClick(artist)}>{artist.name}</p>
                    <ImageStorage
                      bucket="artist_photos"
                      path={artist.photo_url}
                      alt={artist.name}
                      className="artists__content__artistImage"
                    />
                  </div>
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