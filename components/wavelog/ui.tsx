"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export function Icon({ name, style }: { name: string; style?: CSSProperties }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true" style={style}>
      {name}
    </span>
  );
}

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Mirrors the CSS breakpoint so click handlers pick the desktop pane or the mobile detail screen. */
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true
  );
}

export function ChipGroup({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="chip-group">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={option === value ? "chip active" : "chip"}
          aria-pressed={option === value}
          // Clicking the active chip clears it, so optional fields can be left empty again.
          onClick={() => onChange(option === value ? "" : option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function SegControl({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="seg-control" role="radiogroup">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          className={option === value ? "seg-option active" : "seg-option"}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function RatingRow({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  return (
    <div className="rating-row" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          className={n === value ? "rating-btn active" : "rating-btn"}
          onClick={() => onChange(n === value ? null : n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
