"use client";

import { useState, useEffect } from "react";
import "./Search.scss";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import {
  searchArtists,
  searchTracks,
  Track,
  Artist,
} from "../../services/api";
import { useAppContext } from "../../context/AppContext";
import { StorageImage } from "../Admin/components/StorageImage";
import ArtistModal from "../../components/ArtistModal/ArtistModal"; // Import the modal

interface SearchResults {
  artists: Artist[];
  tracks: Track[];
}

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    artists: [],
    tracks: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const [modalArtist, setModalArtist] = useState<Artist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  const { setPlayerTrackList, setTrack, setPlaylistName } =
    useAppContext();

  /* =========================
     DEBOUNCED SEARCH
  ========================= */

  useEffect(() => {
    if (!query.trim()) {
      setResults({ artists: [], tracks: [] });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      await performSearch(query);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  /* =========================
     SEARCH FUNCTION
  ========================= */

  const performSearch = async (searchQuery: string) => {
    try {
      const [artists, tracks] = await Promise.all([
        searchArtists(searchQuery),
        searchTracks(searchQuery),
      ]);

      setResults({ artists, tracks });
    } catch (error) {
      console.error("Search error:", error);
      setResults({ artists: [], tracks: [] });
    }
  };

  /* =========================
     HANDLERS
  ========================= */

  const handleArtistClick = (artist: Artist) => {
    setModalArtist(artist);
    setIsModalOpen(true);
  };

  const handleTrackClick = (track: Track) => {
    setPlayerTrackList([track]);
    setTrack(track);
    handleClose();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalArtist(null);
  };

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const hasResults =
    results.artists.length > 0 || results.tracks.length > 0;

  /* =========================
     RENDER
  ========================= */

  return (
    <section
      className={`searchPage main-content ${
        isFadingOut ? "fade-out" : ""
      }`}
    >
      <div className="main-content__close">
        <button
          className="main-content__close__button"
          onClick={handleClose}
        >
          <FiX size={24} />
        </button>
      </div>

      <h1 className="searchPage__title">MattDigging explorer</h1>

      <div className="searchBar">
        <input
          type="text"
          placeholder="Search for artists or tracks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading && (
        <div className="loading">
          <p>Searching...</p>
        </div>
      )}

      {query && !isLoading && !hasResults && (
        <div className="noResults">
          <p>No results found for "{query}"</p>
        </div>
      )}

      {query && !isLoading && hasResults && (
        <div className="results">
          {/* Artists */}
          {results.artists.length > 0 && (
            <div className="resultGroup">
              <h2>Artists</h2>
              <ul className="artistsList">
                {results.artists.map((artist) => (
                  <li
                    key={artist.id}
                    onClick={() => handleArtistClick(artist)}
                    className="artistItem"
                  >
                    <div className="artistImage">
                      {artist.photo_url && (
                        <StorageImage
                          path={artist.photo_url}
                          alt={artist.name}
                          bucket="artist_photos"
                          className="artistImage"
                        />
                      )}
                    </div>
                    <span>{artist.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tracks */}
          {results.tracks.length > 0 && (
            <div className="resultGroup">
              <h2>Tracks</h2>
              <ul className="tracksList">
                {results.tracks.map((track) => (
                  <li
                    key={track.id}
                    onClick={() => handleTrackClick(track)}
                    className="trackItem"
                  >
                    <div className="trackItem__content">
                      <div className="trackCover">
                        {track.cover_url && (
                          <StorageImage
                            path={track.cover_url}
                            alt={track.title}
                            bucket="covers"
                            className="trackCover"
                          />
                        )}
                      </div>
                      <div className="trackInfo">
                        <span className="trackTitle">{track.title}</span>
                        <span className="trackArtist">{track.artist?.name}</span>
                      </div>
                    </div>
                    <div className="trackItem__play">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Artist Modal */}
      {modalArtist && (
        <ArtistModal
          artist={modalArtist}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
};

export default SearchPage;
