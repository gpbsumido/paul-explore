export default function ParticlesLoading() {
  return (
    <div
      className="flex items-center justify-center bg-black"
      style={{ height: "calc(100dvh - 3.5rem)" }}
    >
      <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}
