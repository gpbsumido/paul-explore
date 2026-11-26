export default function FieldOpsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="h-8 w-48 rounded-lg bg-surface animate-pulse" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="h-96 rounded-2xl bg-surface animate-pulse" />
        <div className="h-96 rounded-2xl bg-surface animate-pulse" />
      </div>
    </div>
  );
}
