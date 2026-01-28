"use client";

import { useEffect, useRef, useState } from "react";
import "./Playlists.scss";
import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { fetchGenres, Genre } from '../../services/api';

const PlaylistsPage = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadGenres = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGenres();
        console.log(data)
        setGenres(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load genres');
      } finally {
        setIsLoading(false);
      }
    };

    loadGenres();
  }, []);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const handleGenreClick = (slug: string) => {
    navigate(`/playlists/genre/${slug}`);
  };

  return (
    <section className={`playlistsPage main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button className="main-content__close__button" onClick={handleClose}>
          <FiX size={24} />
        </button>
      </div>

      <h1>Genres</h1>


        <div className="grid">
          {genres.map((genre) => (
            <div 
              key={genre.id} 
              className="card"
              onClick={() => handleGenreClick(genre.slug)}
            >
              <div className="info">
                <h3>{genre.name}</h3>
              </div>
            </div>
          ))}
        </div>
    </section>
  );
};

export default PlaylistsPage;