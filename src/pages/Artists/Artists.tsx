import "./Artists.scss";
import { useState, useEffect, useRef } from "react";
import { FiX } from 'react-icons/fi';
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from 'react-router-dom';
import { fetchArtists, Artist } from '../../services/api';
import ImageStorage from "../../components/ImageStorage/ImageStorage";
import ArtistModal from "../../components/ArtistModal/ArtistModal";

const MAX_ARTISTS_TO_SHOW = 30;

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

  // Fetch artists on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadArtists = async () => {
      try {
        setIsLoading(true);
        const data = await fetchArtists();
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
        <button className="main-content__close__button main-content__close__button--reverse " onClick={handleClose}>
          <svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.204244 4.65981C-0.069123 4.93318 -0.069123 5.37639 0.204244 5.64976L4.65902 10.1045C4.93238 10.3779 5.3756 10.3779 5.64897 10.1045C5.92233 9.83117 5.92233 9.38795 5.64897 9.11458L1.68917 5.15479L5.64897 1.19499C5.92233 0.92162 5.92233 0.478405 5.64897 0.205038C5.3756 -0.0683293 4.93238 -0.0683293 4.65902 0.205038L0.204244 4.65981ZM33.8867 5.15479V4.45479H0.699219V5.15479V5.85479H33.8867V5.15479Z" fill="var(--color-white)"/>
          </svg>
        </button>
      </div>

      {!isMember ? (
        <>
          <div className="artists__content">
            <div className="artists__content__artistsList">
              {filteredArtists.map((artist) => (
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
          </div>
        </>
      ) : (
        <div>
          <h2>🔒 Only members can access artist profiles. Log in or join to unlock.</h2>
        </div>
      )}

    </section>
  );
};

export default Artists;