import { boardTypeInfo } from "@/lib/board-types";

/** Surfboard outline, stroked with the surrounding text color. Height drives the size (aspect 1:3). */
export function BoardShape({ type, height, className }: { type: string | null | undefined; height: number; className?: string }) {
  const info = boardTypeInfo(type);
  if (!info) return null;
  return (
    <svg className={className} viewBox="0 0 100 300" height={height} width={height / 3} aria-hidden="true">
      <g stroke="currentColor" strokeLinejoin="round" strokeLinecap="round" fill="none">
        <path d={info.outline} strokeWidth={height < 90 ? 4 : 2.4} />
        <path d="M50 13 V284" strokeWidth="1" opacity="0.38" />
        {info.id === "soft_top" ? (
          <g strokeWidth="2">
            <circle cx="35" cy="249" r="2" />
            <circle cx="65" cy="249" r="2" />
            <circle cx="35" cy="262" r="2" />
            <circle cx="65" cy="262" r="2" />
          </g>
        ) : (
          <rect x="48.5" y="274" width="3" height="7" rx="1.5" strokeWidth="1.4" />
        )}
      </g>
    </svg>
  );
}
