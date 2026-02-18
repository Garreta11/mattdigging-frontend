import "./Modals.scss";
import { useAppContext } from "../../context/AppContext";
import { Artist, Track } from "../../services/api";
import ArtistModal from "../ArtistModal/ArtistModal";
import TrackModal from "../TrackModal/TrackModal";

const Modals = () => {
  const { modalArtist, isModalArtistOpen, setIsModalArtistOpen, track, isTrackModalOpen, setIsTrackModalOpen } = useAppContext();

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
    </>
  );
};

export default Modals;