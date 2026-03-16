interface ViewToggleProps {
  view: "summary" | "chat";
  setView: (v: "summary" | "chat") => void;
}

/** Segmented pill toggle between Summary and Chat view on thoughts pages. */
export default function ViewToggle({ view, setView }: ViewToggleProps) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border text-[11px] font-medium">
      <button
        onClick={() => setView("summary")}
        className={`px-2.5 py-1 transition-colors ${
          view === "summary"
            ? "bg-surface text-foreground"
            : "text-muted hover:text-foreground"
        }`}
      >
        Summary
      </button>
      <div className="h-3 w-px bg-border" />
      <button
        onClick={() => setView("chat")}
        className={`px-2.5 py-1 transition-colors ${
          view === "chat"
            ? "bg-surface text-foreground"
            : "text-muted hover:text-foreground"
        }`}
      >
        Chat
      </button>
    </div>
  );
}
