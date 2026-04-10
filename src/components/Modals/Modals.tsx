import "./Modals.scss";
import { useAppContext } from "../../context/AppContext";
import { Artist, Track } from "../../services/api";
import ArtistModal from "../ArtistModal/ArtistModal";
import TrackModal from "../TrackModal/TrackModal";
import PricingModal from "../PricingModal/PricingModal";

const Modals = () => {
  const { modalArtist, isModalArtistOpen, setIsModalArtistOpen, track, isTrackModalOpen, setIsTrackModalOpen, isPricingModalOpen } = useAppContext();

  return (
    <>
      <ArtistModal
        artist={modalArtist as Artist}
        isOpen={isModalArtistOpen}
        onClose={() => setIsModalArtistOpen(false)}
      />

      <TrackModal
        track={track as Track}
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />

      {isPricingModalOpen && <PricingModal />}
    </>
  );
};

export default Modals;