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
          <div className="artists__content">
            <div className="artists__content__searchBar">
              <input
                type="text"
                placeholder="Search artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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


      {/* Modal */}
      {isModalOpen && modalArtist && (
        <ArtistModal
          artist={modalArtist}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
};

export default Artists;