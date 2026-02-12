"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./Playlists.scss";
import { FiX } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGenres, fetchMoods, fetchTracks, Genre, Mood, Track } from '../../services/api';
import TrackItem from '../../components/TrackItem/TrackItem';
import TrackModal from '../../components/TrackModal/TrackModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

const PlaylistsPage = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const genreParam = searchParams.get('genre');
  const moodParam = searchParams.get('mood');

  console.log(genreParam, moodParam);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Si hay filtro, cargar tracks filtrados
        if (genreParam || moodParam) {
          const params = new URLSearchParams();
          if (genreParam) params.append('genre', genreParam);
          if (moodParam) params.append('mood', moodParam);
          
          const data = await fetchTracks(`?${params.toString()}`);
          setTracks(data);
        } else {
          // Si no hay filtro, cargar géneros y moods
          const [genresData, moodsData] = await Promise.all([
            fetchGenres(),
            fetchMoods()
          ]);
          setGenres(genresData);
          setMoods(moodsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [genreParam, moodParam]);

  // Reset hasFetched cuando cambien los params
  useEffect(() => {
    hasFetched.current = false;
  }, [genreParam, moodParam]);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const handleGenreClick = (slug: string) => {
    navigate(`/playlists?genre=${slug}`);
  };

  const handleMoodClick = (slug: string) => {
    navigate(`/playlists?mood=${slug}`);
  };

  const handleClearFilter = () => {
    navigate('/playlists');
  };

  const handleTrackClick = (track: Track) => {
    setSelectedTrack(track);
    setModalOpen(true);
  };

  const getPageTitle = useMemo(() => {
    if (genreParam) {
      const genrePrefixes = [
        'diving into',
        'lost in',
        'exploring',
        'vibing with',
        'discovering',
        'swimming through',
        'journey through',
      ];
      
      const genre = genres.find(g => g.slug === genreParam);
      if (genre) {
        const randomPrefix = genrePrefixes[Math.floor(Math.random() * genrePrefixes.length)];
        return `${randomPrefix} ${genre.name}`;
      }
      return 'genre journey';
    }
    
    if (moodParam) {
      const moodPrefixes = [
        'when you\'re feeling',
        'for those',
        'embracing',
        'channeling',
        'living in',
        'captured in sound:',
        'the essence of',
      ];
      
      const mood = moods.find(m => m.slug === moodParam);
      if (mood) {
        const randomPrefix = moodPrefixes[Math.floor(Math.random() * moodPrefixes.length)];
        return `${randomPrefix} ${mood.name}`;
      }
      return 'mood journey';
    }
    
    return 'let the music find you';
  }, [genreParam, moodParam, genres, moods]);

  return (
    <section className={`playlistsPage main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button className="main-content__close__button" onClick={handleClose}>
          <FiX size={24} />
        </button>
      </div>

      <div className="playlistsPage__header">
        <h1>{getPageTitle}</h1>
        {(genreParam || moodParam) && (
          <button className="playlistsPage__clear-filter" onClick={handleClearFilter}>
            Clear filter
          </button>
        )}
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {/* Carousels cuando no hay filtro */}
      {!genreParam && !moodParam && !isLoading && (
        <>
          <section className="playlistsPage__section">
            <h2>Genres</h2>
            <Swiper
              modules={[Navigation, FreeMode]}
              spaceBetween={24}
              slidesPerView="auto"
              freeMode={true}
              navigation
              className="playlistsPage__carousel"
            >
              {genres.map((genre, index) => (
                <SwiperSlide key={genre.id} className="playlistsPage__slide">
                  <div 
                    className={`card card--color-${(index % 12) + 1}`}
                    onClick={() => handleGenreClick(genre.slug)}
                  >
                    <div className="info">
                      <h3>{genre.name}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          <section className="playlistsPage__section">
            <h2>Moods</h2>
            <Swiper
              modules={[Navigation, FreeMode]}
              spaceBetween={24}
              slidesPerView="auto"
              freeMode={true}
              navigation
              className="playlistsPage__carousel"
            >
              {moods.map((mood, index) => (
                <SwiperSlide key={mood.id} className="playlistsPage__slide">
                  <div 
                    className={`card card--color-${(index % 12) + 1}`}
                    onClick={() => handleMoodClick(mood.slug)}
                  >
                    <div className="info">
                      <h3>{mood.name}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        </>
      )}

      {/* Mostrar tracks cuando hay filtro */}
      {(genreParam || moodParam) && !isLoading && (
        <div className="playlistsPage__tracks">
          {tracks.length === 0 ? (
            <p>No tracks found</p>
          ) : (
            tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onClick={() => handleTrackClick(track)}
              />
            ))
          )}
        </div>
      )}

      <TrackModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        track={selectedTrack}
      />
    </section>
  );
};

export default PlaylistsPage;