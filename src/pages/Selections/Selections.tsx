"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Selections.scss";
import { fetchSelections, fetchTracksBySelection, Selections, Track } from "../../services/api";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import TrackItem from "../../components/TrackItem/TrackItem";
import Loader from "../../components/Loader/Loader";
import CloseButton from "../../components/CloseButton/CloseButton";
import { SelectionCover, getSelectionCovers } from "./components/SelectionCover";
import SelectionCard, { selectionDateRange } from "./components/SelectionCard";
import SelectionsCalendar from "./components/SelectionsCalendar";

type ViewMode = "calendar" | "list";

// ─── SelectionsPage ───────────────────────────────────────────────────────────
// Same layout as the mobile app: a List | Calendar switch, "Available now" (newest first)
// and "Coming soon" sections of cards, a month calendar, and a selection view with a large
// cover, dates, description and the tracks. Non-members get a 3-selection preview.
const PREVIEW_COUNT = 3;

const SelectionsPage = () => {
  const { setPlayerTrackList, setPlaylist, setTrack, isMember, setIsPricingModalOpen, user, authReady } = useAppContext();
  const { track: currentTrack } = useAppContext();
  const [searchParams] = useSearchParams();
  const selectionParam = searchParams.get("selection");
  // List or Calendar, kept in the URL so "Back" from a selection returns to the same view
  const view: ViewMode = searchParams.get("view") === "calendar" ? "calendar" : "list";

  const [selections, setSelections] = useState<Selections[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  // Treat unresolved subscription status as loading so membership UI never flashes
  const isLoading = dataLoading || !authReady;
  const [isFadingOut, setIsFadingOut] = useState(false);
  const navigate = useNavigate();

  // Load selections
  useEffect(() => {
    const loadSelections = async () => {
      try {
        const data = await fetchSelections();
        setSelections(data.filter((s) => s.title.toLowerCase() !== "hidden gems"));
      } catch (error) {
        console.error("Error fetching selections:", error);
      } finally {
        setDataLoading(false);
      }
    };
    loadSelections();
  }, []);

  // Load tracks for active selection
  useEffect(() => {
    if (!selectionParam) { setTracks([]); return; }
    const loadTracks = async () => {
      setIsLoadingTracks(true);
      try {
        setTracks(await fetchTracksBySelection(selectionParam));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingTracks(false);
      }
    };
    loadTracks();
  }, [selectionParam]);

  // ─── Derived values ──────────────────────────────────────
  // The backend returns them oldest first.
  const publishedSelections = selections.filter((s) => s.is_published);
  const upcomingSelections  = selections.filter((s) => !s.is_published);
  const activeSelection     = selections.find((s) => s.id === selectionParam);

  // ─── Handlers ────────────────────────────────────────────
  const setView = (next: ViewMode) => navigate(`/selections${next === "calendar" ? "?view=calendar" : ""}`, { replace: true });

  const handleSelectionClick = (selection: Selections) => {
    if (!selection.is_published) return;
    navigate(`/selections?selection=${selection.id}${view === "calendar" ? "&view=calendar" : ""}`);
  };

  const handleBack = () => navigate(`/selections${view === "calendar" ? "?view=calendar" : ""}`);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate("/"), 1000);
  };

  const handlePlaySelection = async () => {
    if (tracks.length > 0) {
      setTrack(null);
      setPlayerTrackList(tracks);
      setPlaylist({ name: activeSelection?.title ?? '', url: `/selections?selection=${activeSelection?.id}` });
      await new Promise(resolve => setTimeout(resolve, 0));
      setTrack(tracks[0]);
    }
  };

  const handleTrackClick = (track: Track) => {
    setPlaylist({ name: activeSelection?.title ?? '', url: `/selections?selection=${activeSelection?.id}` });
    setPlayerTrackList(tracks);
    setTrack(track);
  };

  const cards = (list: Selections[]) =>
    list.map((selection) => <SelectionCard key={selection.id} selection={selection} onOpen={handleSelectionClick} />);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className={`selectionsPage main-content ${isFadingOut ? "fade-out" : ""}`}>
      <CloseButton onClick={handleClose} />

      {isLoading && <Loader />}

      {!isLoading && selectionParam ? (
        /* ── One selection: large cover, dates, description, tracks ── */
        <div className="selectionsPage__selectionView">
          <button className="selectionsPage__back" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>

          {activeSelection && (
            <div className="selectionsPage__hero">
              <SelectionCover coverUrls={getSelectionCovers(activeSelection)} size={140} />
              <div className="selectionsPage__hero__text">
                <h1 className="selectionsPage__hero__title">{activeSelection.title}</h1>
                <p className="selectionsPage__hero__date">{selectionDateRange(activeSelection)}</p>
                {activeSelection.description && <p className="selectionsPage__hero__description">{activeSelection.description}</p>}
                {!isLoadingTracks && tracks.length > 0 && (
                  <button className="selectionsPage__playAll" onClick={handlePlaySelection}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14286V18.8571L19 12L8 5.14286Z" /></svg>
                    Play selection
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoadingTracks ? (
            <Loader />
          ) : (
            <div className="selectionsPage__selectionView__tracks">
              {tracks.length === 0 ? (
                <p className="selectionsPage__note">No tracks found.</p>
              ) : (
                tracks.map((track, index) => (
                  <TrackItem
                    key={track.id}
                    track={track}
                    index={index}
                    onClick={() => handleTrackClick(track)}
                    isPlaying={currentTrack?.id === track.id}
                  />
                ))
              )}
            </div>
          )}
        </div>
      ) : !isLoading && !isMember ? (
        /* ── Non-members: the 3-selection preview ── */
        <div className="selectionsPage__browse">
          <div className="selectionsPage__notice">
            <p>A preview of our archive. Become a member to unlock every selection.</p>
            <button
              className="selectionsPage__subscribe-btn"
              onClick={() => user ? setIsPricingModalOpen(true) : navigate('/login')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {user ? 'Become a member' : 'Log in'}
            </button>
          </div>
          <h2 className="selectionsPage__section">Available now</h2>
          <div className="selectionsPage__cards">{cards(publishedSelections.slice(0, PREVIEW_COUNT))}</div>
        </div>
      ) : !isLoading && (
        /* ── Members: List | Calendar ── */
        <div className="selectionsPage__browse">
          <div className="selectionsPage__switch" role="tablist">
            {(["list", "calendar"] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                className={`selectionsPage__switch__btn${view === v ? " selectionsPage__switch__btn--active" : ""}`}
                onClick={() => setView(v)}
              >
                {v === "list" ? "List" : "Calendar"}
              </button>
            ))}
          </div>

          {selections.length === 0 ? (
            <p className="selectionsPage__note">No selections available yet.</p>
          ) : view === "calendar" ? (
            <SelectionsCalendar selections={selections} onOpen={handleSelectionClick} />
          ) : (
            <>
              {publishedSelections.length > 0 && (
                <>
                  <h2 className="selectionsPage__section">Available now</h2>
                  <div className="selectionsPage__cards">{cards([...publishedSelections].reverse())}</div>
                </>
              )}
              {upcomingSelections.length > 0 && (
                <>
                  <h2 className="selectionsPage__section">Coming soon</h2>
                  <div className="selectionsPage__cards">{cards(upcomingSelections)}</div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectionsPage;
