/** Pokémon hub: the three app cards. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function PokemonLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Bone className="h-8 w-40" />
        <Bone className="mt-3 h-4 w-full max-w-md" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
