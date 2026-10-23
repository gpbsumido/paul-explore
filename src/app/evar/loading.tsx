/** EVAR sizing: the dark stage, with the top bar, three panels and the dock. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function EvarLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div data-theme="dark" className="bg-background">
        <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4">
          <Bone className="h-20 w-full rounded-2xl" />
          <div className="grid flex-1 grid-cols-1 items-start gap-3 lg:grid-cols-[19rem_minmax(0,1fr)_17rem]">
            <Bone className="mx-auto aspect-square w-full max-w-[min(100%,calc(100dvh_-_17rem))] rounded-xl lg:col-start-2 lg:row-start-1" />
            <Bone className="h-96 w-full rounded-2xl lg:col-start-1 lg:row-start-1" />
            <Bone className="h-72 w-full rounded-2xl lg:col-start-3 lg:row-start-1" />
          </div>
          <Bone className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
