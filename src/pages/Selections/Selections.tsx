"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Selections.scss";
import { fetchSelections, fetchTracksBySelection, Selections, Track } from "../../services/api";
import { supabase } from "../../lib/supabase";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import TrackItem from "../../components/TrackItem/TrackItem";
import Loader from "../../components/Loader/Loader";

type ViewMode = "calendar" | "list";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── SelectionCover ───────────────────────────────────────────────────────────
interface SelectionCoverProps {
  coverUrls: (string | null | undefined)[];
  size?: number;
}

const SelectionCover = ({ coverUrls, size = 80 }: SelectionCoverProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const validUrls = coverUrls.filter(Boolean).slice(0, 3) as string[];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || validUrls.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const loadImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    const getPublicUrl = (path: string) => {
      if (path.startsWith("http")) return path;
      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      return data.publicUrl;
    };

    const drawCircleImage = (img: HTMLImageElement, cx: number, cy: number, radius: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#375d2c";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    const draw = async () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#FFF2A3";
      ctx.fillRect(0, 0, size, size);

      const results = await Promise.allSettled(
        validUrls.map((path) => loadImage(getPublicUrl(path)))
      );

      const centerX      = size / 2;
      const centerY      = size / 2;
      const centerRadius = size * 0.32;
      const sideRadius   = size * 0.22;
      const sideOffset   = size * 0.25;

      if (results[1]?.status === "fulfilled") { ctx.globalAlpha = 0.7; drawCircleImage(results[1].value, centerX - sideOffset, centerY, sideRadius); }
      if (results[2]?.status === "fulfilled") { ctx.globalAlpha = 0.7; drawCircleImage(results[2].value, centerX + sideOffset, centerY, sideRadius); }
      if (results[0]?.status === "fulfilled") { ctx.globalAlpha = 1.0; drawCircleImage(results[0].value, centerX, centerY, centerRadius); }

      ctx.globalAlpha = 1.0;
    };

    draw();
  }, [validUrls.join(","), size]);

  if (validUrls.length === 0) {
    return <div style={{ width: size, height: size, background: "#1a1a1a", borderRadius: "50%", flexShrink: 0 }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: "block", flexShrink: 0, borderRadius: "8px" }}
    />
  );
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const getSelectionCovers = (selection: Selections) =>
  selection.selection_tracks?.slice(0, 3).map((st) => st.tracks?.cover_url ?? null) ?? [];

// ─── SelectionsPage ───────────────────────────────────────────────────────────
const SelectionsPage = () => {
  const { setPlayerTrackList, setPlaylist, setTrack, isMember, setIsPricingModalOpen, user, authReady } = useAppContext();
  const { track: currentTrack } = useAppContext();
  const [searchParams] = useSearchParams();
  const selectionParam = searchParams.get("selection");

  const [selections, setSelections] = useState<Selections[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  // Treat unresolved subscription status as loading so membership UI never flashes
  const isLoading = dataLoading || !authReady;
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
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
  const publishedSelections = selections.filter((s) => s.is_published);
  const upcomingSelections  = selections.filter((s) => !s.is_published);
  const activeSelection     = selections.find((s) => s.id === selectionParam);

  const availableYears = [...new Set(selections.map((s) => new Date(s.published_at).getFullYear()))].sort();

  const selectionsByMonth = selections.reduce((acc, selection) => {
    const date = new Date(selection.published_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(selection);
    return acc;
  }, {} as Record<string, Selections[]>);

  const currentMonthSelections = (selectionsByMonth[`${selectedYear}-${selectedMonth}`] ?? [])
    .sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());

  // ─── Handlers ────────────────────────────────────────────
  const handleSelectionClick = (selection: Selections) => {
    if (selection.is_published) navigate(`/selections?selection=${selection.id}`);
  };

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate("/"), 1000);
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  const canGoPrevious = () => selectedMonth === 0 ? availableYears.includes(selectedYear - 1) : true;
  const canGoNext     = () => selectedMonth === 11 ? availableYears.includes(selectedYear + 1) : true;

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

  const formatWeekYear = (weekNumber: number, year: number) => `Week ${weekNumber}, ${year}`;

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className={`selectionsPage main-content ${isFadingOut ? "fade-out" : ""}`}>

      {/* Home button */}
      <div className="main-content__close">
        <button className="main-content__close__button main-content__close__button--reverse" onClick={handleClose}>
          HOME
          <svg width="17" height="6" viewBox="0 0 17 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_47_2)">
              <path d="M16.898 3.1701C17.0347 3.03342 17.0347 2.81181 16.898 2.67513L14.6706 0.447756C14.5339 0.311057 14.3123 0.311057 14.1756 0.447757C14.0389 0.584422 14.0389 0.806031 14.1756 0.942716L16.1555 2.92261L14.1756 4.90251C14.0389 5.0392 14.0389 5.2608 14.1756 5.39749C14.3123 5.53417 14.5339 5.53417 14.6706 5.39749L16.898 3.1701ZM0.0567477 2.92261L0.0567477 3.27261L16.6505 3.27261L16.6505 2.92261L16.6505 2.57261L0.0567477 2.57261L0.0567477 2.92261Z" fill="var(--color-white)"/>
            </g>
            <defs>
              <clipPath id="clip0_47_2">
                <rect width="17" height="5.5" fill="white" transform="translate(17 5.5) rotate(180)"/>
              </clipPath>
            </defs>
          </svg>
        </button>
      </div>

      {isLoading && <Loader />}

      {!isLoading && selectionParam ? (
        /* ── Active selection view (members and non-members) ── */
        <>
          {isLoadingTracks && <Loader />}

          {!isLoadingTracks && (
            <button className="selectionsPage__selectionView__clear-filter-btn" onClick={() => navigate("/selections")}>
              <svg width="17" height="5.5" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.204244 4.65981C-0.069123 4.93318 -0.069123 5.37639 0.204244 5.64976L4.65902 10.1045C4.93238 10.3779 5.3756 10.3779 5.64897 10.1045C5.92233 9.83117 5.92233 9.38795 5.64897 9.11458L1.68917 5.15479L5.64897 1.19499C5.92233 0.92162 5.92233 0.478405 5.64897 0.205038C5.3756 -0.0683293 4.93238 -0.0683293 4.65902 0.205038L0.204244 4.65981ZM33.8867 5.15479V4.45479H0.699219V5.15479V5.85479H33.8867V5.15479Z" fill="var(--color-white)" />
              </svg>
              Back
            </button>
          )}

          {!isLoadingTracks && activeSelection && (
            <div className="selectionsPage__selectionView__header">
              <h1 className="selectionsPage__selectionView__header__title">
                <span>{activeSelection.title}</span>
              </h1>
              <button className="selectionsPage__selectionView__header__play-playlist" onClick={handlePlaySelection}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="var(--color-white)"/>
                </svg>
              </button>
            </div>
          )}

          {!isLoadingTracks && (
            <div className="selectionsPage__selectionView__tracks">
              {tracks.length === 0 ? (
                <p>No tracks found</p>
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
        </>
      ) : !isLoading && !isMember ? (
        /* ── Browse view (non-member, first 3 selections) ── */
        <>
          {publishedSelections.slice(0, 3).length > 0 && (
            <section className="selectionsPage__listView">
              <p className="selectionsPage__listView__preview-notice">
                A preview of our archive. Become a member to unlock every selection.
              </p>
              <button
                className="selectionsPage__subscribe-btn"
                onClick={() => user ? setIsPricingModalOpen(true) : navigate('/login')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {user ? 'Become a member' : 'Log in'}
              </button>
              <div className="selectionsPage__listView__grid">
               <h2 className="selectionsPage__listView__title">Available Now</h2>
                {publishedSelections.slice(0, 3).map((selection) => {
                  const startDate = new Date(selection.published_at);
                  const endDate = new Date(selection.published_at);
                  endDate.setDate(endDate.getDate() + 6);
                  return (
                    <div
                      key={selection.title}
                      className="selectionsPage__listView__card selectionsPage__listView__card--published"
                      onClick={() => handleSelectionClick(selection)}
                    >
                      <SelectionCover coverUrls={getSelectionCovers(selection)} size={80} />
                      <div className="selectionsPage__listView__card__header">
                        <h3 className="selectionsPage__listView__card__header__title">
                          {selection.title}
                          <span className="selectionsPage__listView__card__header__title__date">
                            · {startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
                            {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, {selection.year}
                          </span>
                        </h3>
                        {selection.description && (
                          <p className="selectionsPage__listView__card__description">{selection.description}</p>
                        )}
                      </div>
                      <p className="selectionsPage__listView__card__header__badge selectionsPage__listView__card__header__badge--published">
                        Published
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : !isLoading && (
        /* ── Browse view ── */
        <>
          <div className="selectionsPage__header">
            <div className="selectionsPage__header__controls">
              <div className="selectionsPage__header__controls__viewToggle">
                <button
                  className={`selectionsPage__header__controls__viewToggle__button selectionsPage__header__controls__viewToggle__button--calendar ${viewMode === "calendar" ? "selectionsPage__header__controls__viewToggle__button--active" : ""}`}
                  onClick={() => setViewMode("calendar")}
                >
                  Calendar
                </button>
                <button
                  className={`selectionsPage__header__controls__viewToggle__button selectionsPage__header__controls__viewToggle__button--list ${viewMode === "list" ? "selectionsPage__header__controls__viewToggle__button--active" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Calendar view */}
          {viewMode === "calendar" && (
            <div className="selectionsPage__calendarView">
              <div className="selectionsPage__calendarView__navigation">
                <button className="selectionsPage__calendarView__nav-button" onClick={handlePreviousMonth} disabled={!canGoPrevious()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M16.5303 3.21967C16.2641 2.9534 15.8474 2.9292 15.5538 3.14705L15.4697 3.21967L7.21967 11.4697C6.9534 11.7359 6.9292 12.1526 7.14705 12.4462L7.21967 12.5303L15.4697 20.7803C15.7626 21.0732 16.2374 21.0732 16.5303 20.7803C16.7966 20.5141 16.8208 20.0974 16.6029 19.8038L16.5303 19.7197L8.8107 12L16.5303 4.28033C16.8232 3.98744 16.8232 3.51256 16.5303 3.21967Z" fill="var(--color-white)" />
                  </svg>
                </button>
                <div className="selectionsPage__calendarView__current-date">
                  <h2 className="selectionsPage__calendarView__month">{MONTHS[selectedMonth]}</h2>
                  <span className="selectionsPage__calendarView__year">{selectedYear}</span>
                </div>
                <button className="selectionsPage__calendarView__nav-button" onClick={handleNextMonth} disabled={!canGoNext()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7.4697 20.7803C7.7359 21.0466 8.1526 21.0708 8.4462 20.853L8.5303 20.7803L16.7803 12.5303C17.0466 12.2641 17.0708 11.8474 16.853 11.5538L16.7803 11.4697L8.5303 3.2197C8.2374 2.9268 7.7626 2.9268 7.4697 3.2197C7.2034 3.4859 7.1792 3.9026 7.3971 4.1962L7.4697 4.2803L15.1893 12L7.4697 19.7197C7.1768 20.0126 7.1768 20.4874 7.4697 20.7803Z" fill="var(--color-white)" />
                  </svg>
                </button>
              </div>

              <div className="selectionsPage__calendarView__grid">
                {currentMonthSelections.length === 0 && (
                  <div className="selectionsPage__calendarView__weekCell">
                    <div className="selectionsPage__calendarView__weekCell__empty">No selections this month.</div>
                  </div>
                )}
                {currentMonthSelections.map((selection) => {
                  const isPublished = selection.is_published;
                  const startDate = new Date(selection.published_at);
                  const endDate = new Date(selection.published_at);
                  endDate.setDate(endDate.getDate() + 6);
                  return (
                    <div
                      key={selection.title}
                      className={`selectionsPage__calendarView__weekCell selectionsPage__calendarView__weekCell--has-selection ${isPublished ? "selectionsPage__calendarView__weekCell--published" : "selectionsPage__calendarView__weekCell--upcoming"}`}
                      onClick={() => handleSelectionClick(selection)}
                    >
                      <SelectionCover coverUrls={getSelectionCovers(selection)} size={80} />
                      <div className="selectionsPage__calendarView__weekCell__content">
                        <div className="selectionsPage__calendarView__weekCell__content__header">
                          <h3 className="selectionsPage__calendarView__weekCell__title">
                            {selection.title}
                            <span className="selectionsPage__calendarView__weekCell__title__date">
                              · {startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
                              {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </h3>
                          <div className={`selectionsPage__calendarView__weekCell__badge selectionsPage__calendarView__weekCell__badge--${isPublished ? "published" : "upcoming"}`}>
                            {isPublished ? "Published" : "Coming Soon"}
                          </div>
                        </div>
                        <div className="selectionsPage__calendarView__weekCell__content__body">
                          <p className="selectionsPage__calendarView__weekCell__content__body__description">{selection.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List view */}
          {viewMode === "list" && (
            <>
              {publishedSelections.length > 0 && (
                <section className="selectionsPage__listView">
                  <h2 className="selectionsPage__listView__title">Available Now</h2>
                  <div className="selectionsPage__listView__grid">
                    {publishedSelections.map((selection) => {
                      const startDate = new Date(selection.published_at);
                      const endDate = new Date(selection.published_at);
                      endDate.setDate(endDate.getDate() + 6);
                      return (
                        <div
                          key={selection.title}
                          className="selectionsPage__listView__card selectionsPage__listView__card--published"
                          onClick={() => handleSelectionClick(selection)}
                        >
                          <SelectionCover coverUrls={getSelectionCovers(selection)} size={80} />
                          <div className="selectionsPage__listView__card__header">
                            <h3 className="selectionsPage__listView__card__header__title">
                              {selection.title}
                              <span className="selectionsPage__listView__card__header__title__date">
                                · {startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
                                {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, {selection.year}
                              </span>
                            </h3>
                            {selection.description && (
                              <p className="selectionsPage__listView__card__description">{selection.description}</p>
                            )}
                          </div>
                          <p className="selectionsPage__listView__card__header__badge selectionsPage__listView__card__header__badge--published">
                            Published
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {upcomingSelections.length > 0 && (
                <section className="selectionsPage__listView">
                  <h2 className="selectionsPage__listView__title">Coming Soon</h2>
                  <div className="selectionsPage__listView__grid">
                    {upcomingSelections.map((selection) => (
                      <div key={selection.title} className="selectionsPage__listView__card selectionsPage__listView__card--upcoming">
                        <SelectionCover coverUrls={getSelectionCovers(selection)} size={60} />
                        <div className="selectionsPage__listView__card__header">
                          <h3 className="selectionsPage__listView__card__header__title">
                            {selection.title}
                            <span className="selectionsPage__listView__card__header__title__date">
                              {formatWeekYear(selection.week_number, selection.year)}
                            </span>
                          </h3>
                          {selection.description && (
                            <p className="selectionsPage__listView__card__description">{selection.description}</p>
                          )}
                        </div>
                        <p className="selectionsPage__listView__card__badge selectionsPage__listView__card__badge--upcoming">
                          Coming Soon
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {selections.length === 0 && (
            <div className="selectionsPage__listView__empty">
              <p>No selections available yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SelectionsPage;