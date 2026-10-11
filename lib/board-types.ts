// Outlines from swell_board_svgs (viewBox 0 0 100 300), drawn with currentColor by <BoardShape>.
export const BOARD_TYPES = [
  {
    id: "shortboard",
    label: "Shortboard",
    outline: "M 50 9 C 37 26 23 70 22 125 C 20 191 31 252 43 287 L 50 284 L 57 287 C 69 252 80 191 78 125 C 77 70 63 26 50 9 Z"
  },
  {
    id: "fish",
    label: "Fish",
    outline: "M 50 20 C 29 35 20 88 20 147 C 20 208 29 263 38 288 L 50 267 L 62 288 C 71 263 80 208 80 147 C 80 88 71 35 50 20 Z"
  },
  {
    id: "midlength",
    label: "Midlength",
    outline: "M 50 12 C 31 12 23 55 23 116 C 22 183 29 245 38 275 C 42 287 46 290 50 290 C 54 290 58 287 62 275 C 71 245 78 183 77 116 C 77 55 69 12 50 12 Z"
  },
  {
    id: "funboard",
    label: "Funboard",
    outline: "M 50 16 C 26 16 20 65 21 128 C 21 199 28 253 39 279 C 43 288 47 290 50 290 C 53 290 57 288 61 279 C 72 253 79 199 79 128 C 80 65 74 16 50 16 Z"
  },
  {
    id: "longboard",
    label: "Longboard",
    outline: "M 50 8 C 27 8 24 55 24 110 C 22 170 27 224 34 258 C 38 278 43 288 50 288 C 57 288 62 278 66 258 C 73 224 78 170 76 110 C 76 55 73 8 50 8 Z"
  },
  {
    id: "gun",
    label: "Gun",
    outline: "M 50 5 C 37 36 25 89 25 153 C 25 219 36 269 50 291 C 64 269 75 219 75 153 C 75 89 63 36 50 5 Z"
  },
  {
    id: "soft_top",
    label: "Soft top",
    outline: "M 50 16 C 27 16 20 62 20 120 L 20 220 C 20 269 31 290 50 290 C 69 290 80 269 80 220 L 80 120 C 80 62 73 16 50 16 Z"
  }
] as const;

export type BoardType = (typeof BOARD_TYPES)[number]["id"];

export function boardTypeInfo(type: string | null | undefined) {
  return BOARD_TYPES.find((t) => t.id === type) ?? null;
}

/** Best guess from a free-text board name, used to prefill the type of boards that don't have one yet. */
export function guessBoardType(name: string): BoardType | null {
  const n = name.toLowerCase();
  if (/soft|foam/.test(n)) return "soft_top";
  if (/\bgun\b|step[- ]?up/.test(n)) return "gun";
  if (/\bfish\b|twin/.test(n)) return "fish";
  if (/long|\blog\b|noserider|\b9'/.test(n)) return "longboard";
  if (/mini ?mal|fun ?board|\b7'/.test(n)) return "funboard";
  if (/mid|egg|\b8'/.test(n)) return "midlength";
  if (/short|thruster|quad|performance|\b[56]'/.test(n)) return "shortboard";
  return null;
}
