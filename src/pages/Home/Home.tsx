import React from 'react';
import './Home.scss';
import Room from '../../components/Room/Room';
import { useAppContext } from '../../context/AppContext';

const backgroundImage = '/frame.png';

const Home = () => {
  const { isFullscreen } = useAppContext();

  return (
    <div className="home" >
      {/* <div className="home__frame" style={{ backgroundImage: `url(${backgroundImage})` }}> */}
      <div className={`home__frame ${isFullscreen ? 'home__frame--fullscreen' : ''}`}>
        <Room />
      </div>
    </div>
  );
};

export default Home;