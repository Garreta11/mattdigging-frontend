"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Selections.scss";
import { fetchSelections, Selections } from "../../services/api";

type ViewMode = "calendar" | "list";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SelectionsPage = () => {
  const [selections, setSelections] = useState<Selections[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isFadingOut, setIsFadingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSelections = async () => {
      try {
        const data = await fetchSelections();
        const filteredData = data.filter(
          (selection) => selection.title.toLowerCase() !== "hidden gems"
        );
        setSelections(filteredData);
        console.log(filteredData);
      } catch (error) {
        console.error("Error fetching selections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSelections();
  }, []);

  const handleSelectionClick = (selection: Selections) => {
    if (selection.is_published) {
      const slug = selection.title.toLowerCase().replace(/\s+/g, "-");
      navigate(`/selections/${slug}`);
    }
  };

  const formatWeekYear = (weekNumber: number, year: number) => {
    return `Week ${weekNumber}, ${year}`;
  };

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  // Group selections by month/year from published_at
  const selectionsByMonth = selections.reduce((acc, selection) => {
    const date = new Date(selection.published_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(selection);
    return acc;
  }, {} as Record<string, Selections[]>);

  // Get unique years available
  const availableYears = [...new Set(
    selections.map((s) => new Date(s.published_at).getFullYear())
  )].sort();

  // Selections for current selected month/year
  const currentKey = `${selectedYear}-${selectedMonth}`;
  const currentMonthSelections = (selectionsByMonth[currentKey] ?? []).sort(
    (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
  );

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const canGoPrevious = () => {
    if (selectedMonth === 0) return availableYears.includes(selectedYear - 1);
    return true;
  };

  const canGoNext = () => {
    if (selectedMonth === 11) return availableYears.includes(selectedYear + 1);
    return true;
  };

  if (isLoading) {
    return (
      <div className="selectionsPage">
        <div className="selectionsPage__loading">
          <p>Loading selections...</p>
        </div>
      </div>
    );
  }

  const publishedSelections = selections.filter((s) => s.is_published);
  const upcomingSelections = selections.filter((s) => !s.is_published);

  return (
    <div className={`selectionsPage main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button className="main-content__close__button main-content__close__button--reverse" onClick={handleClose}>
          <svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.204244 4.65981C-0.069123 4.93318 -0.069123 5.37639 0.204244 5.64976L4.65902 10.1045C4.93238 10.3779 5.3756 10.3779 5.64897 10.1045C5.92233 9.83117 5.92233 9.38795 5.64897 9.11458L1.68917 5.15479L5.64897 1.19499C5.92233 0.92162 5.92233 0.478405 5.64897 0.205038C5.3756 -0.0683293 4.93238 -0.0683293 4.65902 0.205038L0.204244 4.65981ZM33.8867 5.15479V4.45479H0.699219V5.15479V5.85479H33.8867V5.15479Z" fill="var(--color-white)"/>
          </svg>
        </button>
      </div>

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

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="selectionsPage__calendarView">
          {/* Month/Year Selector */}
          <div className="selectionsPage__calendarView__navigation">
            <button
              className="selectionsPage__calendarView__nav-button"
              onClick={handlePreviousMonth}
              disabled={!canGoPrevious()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5303 3.21967C16.2641 2.9534 15.8474 2.9292 15.5538 3.14705L15.4697 3.21967L7.21967 11.4697C6.9534 11.7359 6.9292 12.1526 7.14705 12.4462L7.21967 12.5303L15.4697 20.7803C15.7626 21.0732 16.2374 21.0732 16.5303 20.7803C16.7966 20.5141 16.8208 20.0974 16.6029 19.8038L16.5303 19.7197L8.8107 12L16.5303 4.28033C16.8232 3.98744 16.8232 3.51256 16.5303 3.21967Z" fill="var(--color-white)"/>
              </svg>
            </button>
            <div className="selectionsPage__calendarView__current-date">
              <h2 className="selectionsPage__calendarView__month">{MONTHS[selectedMonth]}</h2>
              <span className="selectionsPage__calendarView__year">{selectedYear}</span>
            </div>
            <button
              className="selectionsPage__calendarView__nav-button"
              onClick={handleNextMonth}
              disabled={!canGoNext()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.4697 20.7803C7.7359 21.0466 8.1526 21.0708 8.4462 20.853L8.5303 20.7803L16.7803 12.5303C17.0466 12.2641 17.0708 11.8474 16.853 11.5538L16.7803 11.4697L8.5303 3.2197C8.2374 2.9268 7.7626 2.9268 7.4697 3.2197C7.2034 3.4859 7.1792 3.9026 7.3971 4.1962L7.4697 4.2803L15.1893 12L7.4697 19.7197C7.1768 20.0126 7.1768 20.4874 7.4697 20.7803Z" fill="var(--color-white)"/>
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
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
                  className={`selectionsPage__calendarView__weekCell selectionsPage__calendarView__weekCell--has-selection ${
                    isPublished
                      ? "selectionsPage__calendarView__weekCell--published"
                      : "selectionsPage__calendarView__weekCell--upcoming"
                  }`}
                  onClick={() => handleSelectionClick(selection)}
                >
                  <div className="selectionsPage__calendarView__weekCell__content">
                    <div className="selectionsPage__calendarView__weekCell__content__header">
                      <h3 className="selectionsPage__calendarView__weekCell__title">
                        {selection.title}
                        <span className="selectionsPage__calendarView__weekCell__title__date">
                          ·{" "}
                          {startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} -{" "}
                          {endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </h3>
                      {isPublished ? (
                        <div className="selectionsPage__calendarView__weekCell__badge selectionsPage__calendarView__weekCell__badge--published">Published</div>
                      ) : (
                        <div className="selectionsPage__calendarView__weekCell__badge selectionsPage__calendarView__weekCell__badge--upcoming">Coming Soon</div>
                      )}
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

      {/* List View */}
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
                    <div className="selectionsPage__listView__card__header">
                      <h3 className="selectionsPage__listView__card__header__title">
                      {selection.title}
                        <span className="selectionsPage__listView__card__header__title__date">
                          ·{" "}
                          {startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} -{" "}
                          {endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </h3>
                      <span className="selectionsPage__listView__card__header__badge selectionsPage__listView__card__header__badge--published">Published</span>
                    </div>
                    {selection.description && (
                      <p className="selectionsPage__listView__card__description">{selection.description}</p>
                    )}
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
                    <div className="selectionsPage__listView__card__header">
                      <h3 className="selectionsPage__listView__card__header__title">{selection.title}</h3>
                      <span className="selectionsPage__listView__card__badge selectionsPage__listView__card__badge--upcoming">Coming Soon</span>
                    </div>
                    <div className="selectionsPage__listView__card__meta">
                      <span className="selectionsPage__listView__card__week">{formatWeekYear(selection.week_number, selection.year)}</span>
                    </div>
                    {selection.description && (
                      <p className="selectionsPage__listView__card__description">{selection.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {selections.length === 0 && !isLoading && (
        <div className="selectionsPage__listView__empty">
          <p>No selections available yet.</p>
        </div>
      )}
    </div>
  );
};

export default SelectionsPage;