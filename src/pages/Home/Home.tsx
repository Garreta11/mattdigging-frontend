import React, { lazy, Suspense } from 'react';
import './Home.scss';
import { useAppContext } from '../../context/AppContext';

// Three.js lives inside Room/Output.js (~550 KB).
// Lazy-loading Room splits it into a separate chunk so every other page
// (Playlists, Artists, Selections...) doesn't pay that cost on first load.
const Room = lazy(() => import('../../components/Room/Room'));

const backgroundImage = '/frame.png';

const Home = () => {
  const { isFullscreen } = useAppContext();

  return (
    <div className="home">
      <div
        className={`home__frame ${isFullscreen ? 'home__frame--fullscreen' : ''}`}
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <Suspense fallback={null}>
          <Room />
        </Suspense>
      </div>
    </div>
  );
};

export default Home;
