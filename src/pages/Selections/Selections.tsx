import React from 'react';
import './Selections.scss';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

const Selections = () => {

  const [isFadingOut, setIsFadingOut] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsFadingOut(true);
    
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };
  return (
    <section className={`selections main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button className="main-content__close__button" onClick={handleClose}>
          <FiX size={24} />
        </button>
      </div>
      <h1>Selections</h1>
    </section>
  );
};

export default Selections;