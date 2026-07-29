/**
 * Route skeleton for /world — mirrors the HUD layout (legend top-left, minimap
 * top-right, placard slot bottom-center) so nothing shifts when the page lands.
 */
export default function WorldLoading() {
  return (
    <main className="relative overflow-hidden bg-black" style={{ height: "calc(100dvh - 3.5rem)" }}>
      <div className="absolute left-4 top-4 h-9 w-72 animate-pulse rounded-2xl bg-white/5" />
      <div className="absolute right-4 top-4 h-[172px] w-[164px] animate-pulse rounded-2xl bg-white/5" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="absolute bottom-6 left-1/2 h-24 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 animate-pulse rounded-2xl bg-white/5" />
    </main>
  );
}
