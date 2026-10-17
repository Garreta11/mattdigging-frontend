import { useState } from "react";
import { Selections } from "../../../services/api";
import SelectionCard from "./SelectionCard";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

// Months are counted as one number (year * 12 + month) so "next month" is just + 1.
const monthKey = (date: Date) => date.getFullYear() * 12 + date.getMonth();
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface SelectionsCalendarProps {
  selections: Selections[];
  onOpen: (selection: Selections) => void;
}

// Month calendar of weekly selections, like the mobile app.
// The day a selection is published is marked: green = available, outlined = coming soon.
const SelectionsCalendar = ({ selections, onOpen }: SelectionsCalendarProps) => {
  const dated = selections.map((s) => ({ selection: s, date: new Date(s.published_at) }));
  const months = dated.map((d) => monthKey(d.date));
  const first = Math.min(...months);
  const last = Math.max(...months);

  // Start on the month of the latest available selection (or the last month with anything).
  const published = dated.filter((d) => d.selection.is_published);
  const latestPublished = published[published.length - 1];
  const [month, setMonth] = useState(latestPublished ? monthKey(latestPublished.date) : last);

  const year = Math.floor(month / 12);
  const monthIndex = month % 12;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Weeks start on Monday: getDay() is 0 for Sunday, so shift by 6.
  const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const inMonth = dated
    .filter((d) => monthKey(d.date) === month)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const selectionOn = (day: number) => inMonth.find((d) => sameDay(d.date, new Date(year, monthIndex, day)));
  const today = new Date();
  const title = new Date(year, monthIndex, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="selectionsCalendar">
      <div className="selectionsCalendar__month">
        <button type="button" className="selectionsCalendar__arrow" onClick={() => setMonth(month - 1)} disabled={month <= first} aria-label="Previous month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h2 className="selectionsCalendar__title">{title}</h2>
        <button type="button" className="selectionsCalendar__arrow" onClick={() => setMonth(month + 1)} disabled={month >= last} aria-label="Next month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div className="selectionsCalendar__grid">
        {WEEKDAYS.map((d, i) => (
          <span key={`w${i}`} className="selectionsCalendar__weekday">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`b${i}`} />;
          const entry = selectionOn(day);
          const isToday = sameDay(today, new Date(year, monthIndex, day));
          const state = entry ? (entry.selection.is_published ? "published" : "upcoming") : isToday ? "today" : "";
          return (
            <button
              key={`d${day}`}
              type="button"
              className={`selectionsCalendar__day${state ? ` selectionsCalendar__day--${state}` : ""}`}
              disabled={!entry?.selection.is_published}
              onClick={() => entry && onOpen(entry.selection)}
              title={entry ? entry.selection.title : undefined}
              aria-label={entry ? `${entry.selection.title}, ${day} ${title}` : `${day} ${title}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="selectionsCalendar__legend">
        <span><i className="selectionsCalendar__dot selectionsCalendar__dot--published" /> Available</span>
        <span><i className="selectionsCalendar__dot selectionsCalendar__dot--upcoming" /> Coming soon</span>
      </div>

      <div className="selectionsCalendar__cards">
        {inMonth.length === 0 ? (
          <p className="selectionsPage__note">No selections this month.</p>
        ) : (
          inMonth.map(({ selection }) => <SelectionCard key={selection.id} selection={selection} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
};

export default SelectionsCalendar;
