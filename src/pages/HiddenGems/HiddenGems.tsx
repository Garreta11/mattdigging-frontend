import { useState } from "react";
import './HiddenGems.scss';

const HiddenGemsPage = () => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  return(
    <section className={`hidden-gems main-content ${isFadingOut ? 'fade-out' : ''}`}>
    <div className="hidden-gems__content">
      <div className="hidden-gems__content__title">
        <h1>Hidden Gems</h1>
      </div>
    </div>
  </section>
  );
};

export default HiddenGemsPage;