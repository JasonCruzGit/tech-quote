export default function SaveIndicator({
  isSaving,
  savedLabel = "All changes saved",
}: {
  isSaving: boolean;
  savedLabel?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-500)]">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isSaving ? "bg-[var(--warn)]" : "bg-[var(--ok)]"
        }`}
        aria-hidden
      />
      {isSaving ? "Saving…" : savedLabel}
    </span>
  );
}
