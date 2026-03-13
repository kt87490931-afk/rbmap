"use client";

export function VenueEditButton({ section }: { section: string }) {
  return (
    <button
      type="button"
      className="section-edit-btn"
      style={section === "hero" ? { top: 14, right: 14, zIndex: 10 } : undefined}
      onClick={() => (window as unknown as { openModal?: (id: string) => void }).openModal?.(section)}
    >
      <svg viewBox="0 0 20 20" width={12} height={12}>
        <path
          fill="currentColor"
          d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
        />
      </svg>
      편집
    </button>
  );
}
