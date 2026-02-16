"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Selections.scss";
import { fetchSelections, Selections } from "../../services/api";
/* import { FiChevronLeft, FiChevronRight, FiCalendar, FiGrid } from "react-icons/fi"; */

type ViewMode = "calendar" | "list";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper to get week number from date
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Helper to get all weeks in a month
const getWeeksInMonth = (year: number, month: number): number[] => {
  const weeks: number[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    const weekNum = getWeekNumber(currentDate);
    if (!weeks.includes(weekNum)) {
      weeks.push(weekNum);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return weeks;
};

const SelectionsPage = () => {
  const [selections, setSelections] = useState<Selections[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const navigate = useNavigate();

  useEffect(() => {
    const loadSelections = async () => {
      try {
        const data = await fetchSelections();
        const filteredData = data.filter(
          (selection) => selection.title.toLowerCase() !== "hidden gems"
        );
        setSelections(filteredData);
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

  // Get unique years from selections
  const availableYears = [...new Set(selections.map((s) => s.year))].sort();

  // Get selections for selected year
  const yearSelections = selections.filter((s) => s.year === selectedYear);

  // Create a map of week numbers to selections
  const weekMap = new Map<number, Selections>();
  yearSelections.forEach((selection) => {
    weekMap.set(selection.week_number, selection);
  });

  // Get weeks for the selected month
  const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);

  // Navigation handlers
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
    if (selectedMonth === 0) {
      return availableYears.includes(selectedYear - 1);
    }
    return true;
  };

  const canGoNext = () => {
    if (selectedMonth === 11) {
      return availableYears.includes(selectedYear + 1);
    }
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
    <div className="selectionsPage main-content">
      <div className="selectionsPage__header">
        <div className="selectionsPage__header-content">
          <h1 className="selectionsPage__title">Music Selections</h1>
          <p className="selectionsPage__subtitle">
            Curated collections of hidden gems and rare tracks
          </p>
        </div>

        {/* View Toggle */}
        <div className="selectionsPage__controls">
          <div className="viewToggle">
            <button
              className={`viewToggle__button ${viewMode === "calendar" ? "viewToggle__button--active" : ""}`}
              onClick={() => setViewMode("calendar")}
            >
              {/* <FiCalendar size={20} /> */}
              Calendar
            </button>
            <button
              className={`viewToggle__button ${viewMode === "list" ? "viewToggle__button--active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              {/* <FiGrid size={20} /> */}
              
              List
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="calendarView">
          {/* Month/Year Selector */}
          <div className="calendarView__navigation">
            <button
              className="calendarView__nav-button"
              onClick={handlePreviousMonth}
              disabled={!canGoPrevious()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" fill="currentColor"/>
              </svg>
            </button>
            <div className="calendarView__current-date">
              <h2 className="calendarView__month">{MONTHS[selectedMonth]}</h2>
              <span className="calendarView__year">{selectedYear}</span>
            </div>
            <button
              className="calendarView__nav-button"
              onClick={handleNextMonth}
              disabled={!canGoNext()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="calendarView__grid">
            {weeksInMonth.map((weekNumber) => {
              const selection = weekMap.get(weekNumber);
              const hasSelection = !!selection;
              const isPublished = selection?.is_published;

              return (
                <div
                  key={weekNumber}
                  className={`weekCell ${hasSelection ? "weekCell--has-selection" : ""} ${
                    isPublished ? "weekCell--published" : ""
                  } ${hasSelection && !isPublished ? "weekCell--upcoming" : ""}`}
                  onClick={() => selection && handleSelectionClick(selection)}
                >
                  <div className="weekCell__number">Week {weekNumber}</div>
                  {selection && (
                    <>
                      <div className="weekCell__title">{selection.title}</div>
                      {isPublished && (
                        <div className="weekCell__badge">Published</div>
                      )}
                      {!isPublished && (
                        <div className="weekCell__badge weekCell__badge--upcoming">
                          Coming Soon
                        </div>
                      )}
                    </>
                  )}
                  {!hasSelection && (
                    <div className="weekCell__empty">No selection</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info text */}
          <div className="calendarView__info">
            <p>
              Showing {weeksInMonth.length} weeks in {MONTHS[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {/* Published Selections */}
          {publishedSelections.length > 0 && (
            <section className="selectionsPage__section">
              <h2 className="selectionsPage__section-title">Available Now</h2>
              <div className="selectionsPage__grid">
                {publishedSelections.map((selection) => (
                  <div
                    key={selection.title}
                    className="selectionCard selectionCard--published"
                    onClick={() => handleSelectionClick(selection)}
                  >
                    <div className="selectionCard__header">
                      <h3 className="selectionCard__title">{selection.title}</h3>
                      <span className="selectionCard__badge selectionCard__badge--published">
                        Published
                      </span>
                    </div>

                    <div className="selectionCard__meta">
                      <span className="selectionCard__week">
                        {formatWeekYear(selection.week_number, selection.year)}
                      </span>
                      {selection.published_at && (
                        <span className="selectionCard__date">
                          {new Date(selection.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {selection.description && (
                      <p className="selectionCard__description">
                        {selection.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Selections */}
          {upcomingSelections.length > 0 && (
            <section className="selectionsPage__section">
              <h2 className="selectionsPage__section-title">Coming Soon</h2>
              <div className="selectionsPage__grid">
                {upcomingSelections.map((selection) => (
                  <div
                    key={selection.title}
                    className="selectionCard selectionCard--upcoming"
                  >
                    <div className="selectionCard__header">
                      <h3 className="selectionCard__title">{selection.title}</h3>
                      <span className="selectionCard__badge selectionCard__badge--upcoming">
                        Upcoming
                      </span>
                    </div>

                    <div className="selectionCard__meta">
                      <span className="selectionCard__week">
                        {formatWeekYear(selection.week_number, selection.year)}
                      </span>
                    </div>

                    {selection.description && (
                      <p className="selectionCard__description">
                        {selection.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {selections.length === 0 && !isLoading && (
        <div className="selectionsPage__empty">
          <p>No selections available yet.</p>
        </div>
      )}
    </div>
  );
};

export default SelectionsPage;