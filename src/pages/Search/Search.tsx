"use client";

import { useState, useMemo } from "react";
import "./Search.scss";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";

interface Item {
  id: number;
  type: "artist" | "country" | "genre" | "mood";
  name: string;
}

const mockData: Item[] = [
  // Artists
  { id: 1, type: "artist", name: "Daft Punk" },
  { id: 2, type: "artist", name: "Rosalía" },
  { id: 3, type: "artist", name: "Beyoncé" },

  // Countries
  { id: 4, type: "country", name: "Spain" },
  { id: 5, type: "country", name: "France" },
  { id: 6, type: "country", name: "USA" },

  // Genres
  { id: 7, type: "genre", name: "Electronic" },
  { id: 8, type: "genre", name: "Pop" },
  { id: 9, type: "genre", name: "Rock" },

  // Moods
  { id: 10, type: "mood", name: "Chill" },
  { id: 11, type: "mood", name: "Energetic" },
  { id: 12, type: "mood", name: "Romantic" },
];

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const navigate = useNavigate();

  const filteredResults = useMemo(() => {
    if (!query) return [];
    return mockData.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const groupedResults = useMemo(() => {
    return filteredResults.reduce(
      (acc, item) => {
        acc[item.type].push(item);
        return acc;
      },
      { artist: [], country: [], genre: [], mood: [] } as Record<
        "artist" | "country" | "genre" | "mood",
        Item[]
      >
    );
  }, [filteredResults]);

  const handleClose = () => {
    setIsFadingOut(true);
    
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <section className={`searchPage main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button className="main-content__close__button" onClick={handleClose}>
          <FiX size={24} />
        </button>
      </div>
      <h1>Search</h1>

      <div className="searchBar">
        <input
          type="text"
          placeholder="Search for artists, countries, genres, or moods..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {query && (
        <div className="results">
          {Object.entries(groupedResults).map(([type, items]) =>
            items.length > 0 ? (
              <div key={type} className="resultGroup">
                <h2>{type.charAt(0).toUpperCase() + type.slice(1)}s</h2>
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      )}
    </section>
  );
};

export default SearchPage;
