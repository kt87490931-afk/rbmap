"use client";

export function VenueEditButton({ section, icon = "pencil" }: { section: string; icon?: "pencil" | "cog" }) {
  const isCog = icon === "cog";
  return (
    <button
      type="button"
      className="section-edit-btn"
      style={section === "hero" ? { top: 14, right: 14, zIndex: 10 } : undefined}
      onClick={() => (window as unknown as { openModal?: (id: string) => void }).openModal?.(section)}
      title={isCog ? "가이드·키워드 편집" : "편집"}
    >
      {isCog ? (
        <svg viewBox="0 0 24 24" width={12} height={12}>
          <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" width={12} height={12}>
          <path fill="currentColor" d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      )}
      {isCog ? "설정" : "편집"}
    </button>
  );
}
