import React from 'react';
import './Home.scss';
import Room from '../../components/Room/Room';

const backgroundImage = '/frame.png';

const Home = () => {
  return (
    <div className="home" >
      <div className="home__frame" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <Room />
      </div>
    </div>
  );
};

export default Home;