import { Selections } from "../../../services/api";
import { SelectionCover, getSelectionCovers } from "./SelectionCover";

// "3 Jan – 9 Jan, 2026": the week a selection covers.
export const selectionDateRange = (selection: Selections) => {
  const start = new Date(selection.published_at);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const dayMonth = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${dayMonth(start)} – ${dayMonth(end)}, ${selection.year}`;
};

interface SelectionCardProps {
  selection: Selections;
  onOpen: (selection: Selections) => void;
}

// One weekly selection, as in the mobile app: artwork, title, dates, description.
// Upcoming selections are dimmed and can't be opened.
const SelectionCard = ({ selection, onOpen }: SelectionCardProps) => {
  const upcoming = !selection.is_published;
  return (
    <button
      type="button"
      className={`selectionCard${upcoming ? " selectionCard--upcoming" : ""}`}
      onClick={() => onOpen(selection)}
      disabled={upcoming}
    >
      <SelectionCover coverUrls={getSelectionCovers(selection)} size={80} />
      <div className="selectionCard__text">
        <h3 className="selectionCard__title">{selection.title}</h3>
        <p className="selectionCard__date">{upcoming ? `Coming soon · ${selectionDateRange(selection)}` : selectionDateRange(selection)}</p>
        {selection.description && <p className="selectionCard__description">{selection.description}</p>}
      </div>
    </button>
  );
};

export default SelectionCard;
