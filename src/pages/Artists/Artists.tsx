import "./Artists.scss";
import { useState, useEffect, useRef } from "react";
import { FiX } from 'react-icons/fi';
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from 'react-router-dom';
import { fetchArtists, Artist } from '../../services/api';
import { StorageImage } from "../Admin/components/StorageImage";

const MAX_ARTISTS_TO_SHOW = 30;

const Artists = () => {
  const { user } = useAppContext();
  const isMember = user?.isMember;

  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [modalArtist, setModalArtist] = useState<Artist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleClick = (artist: Artist) => {
    setModalArtist(artist);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
        <button className="main-content__close__button" onClick={handleClose}>
          <FiX size={24} />
        </button>
      </div>

      {!isMember ? (
        <>
          <div className="artists__header">
            <p className="artists__header__description">
              Highlighting artists that inspire, innovate, and transform the music scene.
            </p>
          </div>

          <div className="artists__content">
            <div className="artists__content__searchBar">
              <input
                type="text"
                placeholder="Search artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {filteredArtists.map((artist) => (
              <div key={artist.id}>
                <h2 className="artists__content__artistName" onClick={() => handleClick(artist)}>{artist.name}</h2>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div>
          <h2>🔒 Only members can access artist profiles. Log in or join to unlock.</h2>
        </div>
      )}


      {/* Modal */}
      {isModalOpen && modalArtist && (
        <div className="artists__modal" onClick={handleCloseModal}>
          <div className="artists__modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="artists__modal__close" onClick={handleCloseModal}>
              <FiX size={24} />
            </button>

            {modalArtist.photo_url && (
              <div className="artists__modal__image">
                <StorageImage
                  bucket="artist_photos"
                  path={modalArtist.photo_url}
                  alt={modalArtist.name}
                  className="artists__modal__image"
                />
              </div>
            )}

            <div className="artists__modal__info">
              <h1 className="artists__modal__name">{modalArtist.name}</h1>

              {modalArtist.country && (
                <p className="artists__modal__country">{modalArtist.country}</p>
              )}
              

              {modalArtist.bio && (
                <p className="artists__modal__bio">{modalArtist.bio}</p>
              )}

            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Artists;