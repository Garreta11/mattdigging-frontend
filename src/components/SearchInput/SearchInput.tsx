import './SearchInput.scss';
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import {
  searchArtists,
  searchTracks,
  Track,
  Artist,
} from "../../services/api";
import ImageStorage from "../ImageStorage/ImageStorage";

interface SearchResults {
  artists: Artist[];
  tracks: Track[];
}

const SearchInput = () => {
  const { setModalArtist, setIsModalArtistOpen, setTrack } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    artists: [],
    tracks: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /* =========================
     CLICK OUTSIDE
  ========================= */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setQuery("");
        setResults({ artists: [], tracks: [] });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      console.log(artists, tracks);

      setResults({ artists, tracks });
    } catch (error) {
      console.error("Search error:", error);
      setResults({ artists: [], tracks: [] });
    }
  };

  /* =========================
     HANDLE CLICK FUNCTIONS
  ========================= */
  const handleArtistClick = (artist: Artist) => {
    setModalArtist(artist);
    setIsModalArtistOpen(true);
    setQuery("");
    setResults({ artists: [], tracks: [] });
  };

  const handleTrackClick = (track: Track) => {
    setTrack(track);
    setQuery("");
    setResults({ artists: [], tracks: [] });
  };

  const handlePlaylistsClick = () => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('fade-out');
      
      // Wait for animation to complete before navigating
      setTimeout(() => {
        navigate('/playlists');
        // Remove fade-out and add fade-in after navigation
        setTimeout(() => {
          mainContent.classList.remove('fade-out');
          mainContent.classList.add('fade-in');
          // Remove fade-in class after animation completes
          setTimeout(() => {
            mainContent.classList.remove('fade-in');
          }, 300);
        }, 50);
      }, 1000); // Match this with your CSS animation duration
    } else {
      navigate('/playlists');
    }
    setQuery("");
    setResults({ artists: [], tracks: [] });
  };

  const hasResults =
    results.artists.length > 0 || results.tracks.length > 0;

  return (
    <div className="search" ref={searchRef}>
      <div className="search__input">
        <div className="search__input__content">
          <svg className="search__input__content__icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 7C1.5 3.96243 3.96243 1.5 7 1.5C10.0376 1.5 12.5 3.96243 12.5 7C12.5 10.0376 10.0376 12.5 7 12.5C3.96243 12.5 1.5 10.0376 1.5 7ZM7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14C8.6628 14 10.1902 13.4202 11.3911 12.4518L16.7197 17.7803C17.0126 18.0732 17.4874 18.0732 17.7803 17.7803C18.0732 17.4874 18.0732 17.0126 17.7803 16.7197L12.4518 11.3911C13.4202 10.1902 14 8.6628 14 7C14 3.13401 10.866 0 7 0Z" fill="#F5F1E8"/>
          </svg>

          <input className="search__input__content__input" type="text" placeholder="What do you want to play?" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>

        <div className="search__input__playlists" onClick={() => handlePlaylistsClick()}>
          <svg className={`search__input__playlists__icon${location.pathname === '/playlists' ? ' search__input__playlists__icon--active' : ''}`} width="26.12" height="18" viewBox="0 0 33 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.3458 0H6.79231C5.80574 0 4.99854 0.807208 4.99854 1.79377V20.3472C4.99854 21.3338 5.80574 22.141 6.79231 22.141H25.3458C26.3323 22.141 27.1395 21.3338 27.1395 20.3472V1.79377C27.1395 0.807208 26.3323 0 25.3458 0ZM25.9437 20.3535C25.9437 20.6824 25.6746 20.9515 25.3458 20.9515H6.79231C6.46345 20.9515 6.19438 20.6824 6.19438 20.3535V1.80009C6.19438 1.47123 6.46345 1.20216 6.79231 1.20216H25.3458C25.6746 1.20216 25.9437 1.47123 25.9437 1.80009V20.3535Z" fill="#F5F1E8"/>
            <path d="M18.7383 9.40565L15.061 7.57001C14.481 7.27703 13.7994 7.30692 13.2433 7.65372C12.6873 7.99453 12.3584 8.59245 12.3584 9.24418V12.9214C12.3584 13.5732 12.6873 14.1651 13.2433 14.5119C13.5423 14.6972 13.8831 14.7929 14.2239 14.7929C14.5109 14.7929 14.7979 14.7271 15.061 14.5956L18.7383 12.76C19.372 12.4431 19.7727 11.8033 19.7727 11.0917C19.7727 10.3802 19.3781 9.74045 18.7383 9.42352V9.40565ZM18.2061 11.6718L14.5289 13.5074C14.3136 13.6151 14.0804 13.6031 13.8771 13.4775C13.6739 13.352 13.5602 13.1427 13.5602 12.9035V9.22628C13.5602 8.98711 13.6739 8.77783 13.8771 8.65227C13.9848 8.5865 14.1103 8.55063 14.2299 8.55063C14.3316 8.55063 14.4332 8.57454 14.5289 8.62238L18.2061 10.458C18.4393 10.5716 18.5768 10.7988 18.5768 11.0559C18.5768 11.313 18.4393 11.5402 18.2061 11.6539L18.2061 11.6718Z" fill="#F5F1E8"/>
            <path d="M1.86552 2.78661H3.17499C3.50385 2.78661 3.77291 2.51754 3.77291 2.18868C3.77291 1.85982 3.50385 1.59076 3.17499 1.59076H1.86552C0.837094 1.59076 0 2.42785 0 3.45628V18.6855C0 19.7139 0.837094 20.551 1.86552 20.551H3.17499C3.50385 20.551 3.77291 20.2819 3.77291 19.9531C3.77291 19.6242 3.50385 19.3551 3.17499 19.3551H1.86552C1.49481 19.3551 1.19585 19.0562 1.19585 18.6855V3.45628C1.19585 3.08557 1.49481 2.78661 1.86552 2.78661Z" fill="#F5F1E8"/>
            <path d="M30.2663 1.59076H28.9568C28.628 1.59076 28.3589 1.85982 28.3589 2.18868C28.3589 2.51754 28.628 2.78661 28.9568 2.78661H30.2663C30.637 2.78661 30.936 3.08557 30.936 3.45628V18.6855C30.936 19.0562 30.637 19.3551 30.2663 19.3551H28.9568C28.628 19.3551 28.3589 19.6242 28.3589 19.9531C28.3589 20.2819 28.628 20.551 28.9568 20.551H30.2663C31.2947 20.551 32.1318 19.7139 32.1318 18.6855V3.45628C32.1318 2.42785 31.2947 1.59076 30.2663 1.59076Z" fill="#F5F1E8"/>
          </svg>

          <div className="search__input__playlists__tooltip">
            <p>Discover</p>
          </div>

        </div>
      </div>

      <div className={`search__results ${hasResults ? "search__results--open" : ""}`}>
        
        {isLoading && (
          <div className="search__results__loading">
            <p>Searching...</p>
          </div>
        )}
        
        {query && !isLoading && !hasResults && (
          <div className="search__results__noResults">
            <p>No results found for "{query}"</p>
          </div>
        )}
        
        {query && !isLoading && hasResults && (
          <div className="search__results__content">
            {/* Artists */}
            {results.artists.length > 0 && (
              <div className="search__results__content__group">
                <h2 className="search__results__content__group__title">Artists</h2>
                <ul className="search__results__content__artists">
                  {results.artists.map((artist) => (
                    <li
                      key={artist.id}
                      onClick={() => handleArtistClick(artist)}
                      className="search__results__content__artists__item"
                    >
                      <div className="search__results__content__artists__item__image">
                        {artist.photo_url && (
                          <ImageStorage
                            path={artist.photo_url}
                            alt={artist.name}
                            bucket="artist_photos"
                            className="search__results__content__artists__item__image"
                          />
                        )}
                      </div>
                      <h3>{artist.name}</h3>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tracks */}
            {results.tracks.length > 0 && (
              <div className="search__results__content__group">
                <h2 className="search__results__content__group__title">Tracks</h2>
                <ul className="search__results__content__tracks">
                  {results.tracks.map((track) => (
                    <li
                      key={track.id}
                      onClick={() => handleTrackClick(track)}
                      className="search__results__content__tracks__item"
                    >
                      <div className="search__results__content__tracks__item__content">
                        <div className="search__results__content__tracks__item__image">
                          {track.cover_url && (
                            <ImageStorage
                              path={track.cover_url}
                              alt={track.title}
                              bucket="covers"
                              className="search__results__content__tracks__item__image"
                            />
                          )}
                        </div>
                        <div className="search__results__content__tracks__item__info">
                          <h3 className="search__results__content__tracks__item__info__title">{track.title}</h3>
                          <p className="search__results__content__tracks__item__info__artist">{track.artist?.name}</p>
                        </div>
                      </div>
                      <div className="search__results__content__tracks__item__play">
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
      </div>
    </div>
  );
};

export default SearchInput;