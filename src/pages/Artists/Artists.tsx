import "./Artists.scss";
import { useState, useEffect, useRef } from "react";
import { FiX } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from 'react-router-dom';
import { fetchArtists, Artist } from '../../services/api';

const MAX_ARTISTS_TO_SHOW = 30;

const Artists = () => {
  const { user } = useAppContext();
  const isMember = user?.isMember;

  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hoveredArtist, setHoveredArtist] = useState<Artist | null>(null);
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
    if (!isMember) return;
    // Navigate to artist detail page
    navigate(`/artists/${artist.slug}`);
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

      {/* Swiper carousel */}
      {!isLoading && artists.length > 0 && (
        <Swiper
          modules={[Autoplay]}
          spaceBetween={10}
          slidesPerView="auto"
          loop={true}
          speed={10000}
          autoplay={{
            delay: 0,
            pauseOnMouseEnter: true,
            disableOnInteraction: false,
          }}
          className="artistsSwiper"
        >
          {artists.map((artist) => {
            console.log(artist)
            if (artist.photo_url) return null;
            return (
              <SwiperSlide key={artist.id}>
                <div className="artistImage">
                  <img 
                    src={artist.photo_url || '/artists/default-artist.jpg'} 
                    alt={artist.name}
                    onError={(e) => {
                      e.currentTarget.src = '/artists/default-artist.jpg';
                    }}
                  />
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      )}
      
      <div className="artists__header">
        <p className="artists__header__description">
          Highlighting artists that inspire, innovate, and transform the music scene.
        </p>
      </div>
      
      <div className="artists__content">
        
        {isLoading && <p className="loading">Loading artists...</p>}

        {error && (
          <div className="error">
            <p>Error: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="artists__content__searchBar">
              <input
                type="text"
                placeholder="Search artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="artistsLayout">
              <div className="artistsList__container">
                {/* LEFT SIDE: LIST */}
                <div className="artistsList">
                  {filteredArtists.slice(0, MAX_ARTISTS_TO_SHOW).map((artist) => (
                    <div
                      key={artist.id}
                      className={`artistName ${!isMember ? "disabled" : ""}`}
                      onMouseEnter={() => setHoveredArtist(artist)}
                      onMouseLeave={() => setHoveredArtist(null)}
                      onClick={() => handleClick(artist)}
                    >
                      {artist.name}
                    </div>
                  ))}
                  
                  {/* Show "..." if more than MAX_ARTISTS_TO_SHOW results */}
                  {filteredArtists.length > MAX_ARTISTS_TO_SHOW && (
                    <div className="artistName dots">...</div>
                  )}

                  {filteredArtists.length === 0 && (
                    <p className="noResults">No artists found.</p>
                  )}
                </div>

                {/* RIGHT SIDE: ONE IMAGE */}
                <div className="artistsPreview">
                  {hoveredArtist && (
                    <div
                      style={{ 
                        backgroundImage: `url(${hoveredArtist.photo_url || '/artists/default-artist.jpg'})` 
                      }}
                      className="previewImage"
                    />
                  )}
                </div>
              </div>
            </div>

            {!isMember && (
              <p className="notice">
                🔒 Only members can access artist profiles. Log in or join to unlock.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Artists;