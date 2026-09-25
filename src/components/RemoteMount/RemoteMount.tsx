"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  isCompatibleContract,
  type HostContext,
  type RemoteModule,
} from "@paul-portfolio/work-portfolio-contract";
import Button from "@/components/ui/Button";

type Status =
  | { kind: "loading" }
  | { kind: "mounted" }
  | { kind: "unavailable" }
  | { kind: "incompatible" };

/**
 * Mounts a micro-frontend remote into this page and keeps its failures here.
 *
 * The remote ships on its own schedule, so everything about it is treated as
 * something that can go wrong: the load can fail or hang, and a new release
 * can speak a contract major this build doesn't know. Each of those ends in a
 * fallback card with Retry, and the rest of the page never notices.
 *
 * Not tied to the work portfolio. Anything that exposes the contract's
 * mount(el, ctx) can go through here.
 *
 * @param load fetches the remote's exposed module (see lib/mfe/federation)
 * @param context what the remote gets on mount; a new object calls update()
 * @param skeleton shown while loading, sized like the mounted remote so the
 *   swap doesn't shift the layout
 * @param onMounted told which remote release ended up on the page
 */
export default function RemoteMount({
  label,
  load,
  context,
  skeleton,
  onMounted,
  aboutHref,
  timeoutMs = 8000,
  className,
}: {
  label: string;
  load: () => Promise<RemoteModule | undefined>;
  context: HostContext;
  skeleton: ReactNode;
  onMounted?: (remote: RemoteModule) => void;
  aboutHref?: string;
  timeoutMs?: number;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const handle = useRef<ReturnType<RemoteModule["mount"]> | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  // The first context goes in through mount(); later ones through update().
  // Refs keep the load effect from re-running (and remounting) on every new
  // context object or callback identity.
  const latest = useRef({ context, load, onMounted });
  useEffect(() => {
    latest.current = { context, load, onMounted };
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("remote timed out")), timeoutMs);
    });

    Promise.race([latest.current.load(), timeout])
      .then((remote) => {
        if (cancelled || !el.current) return;
        if (!remote || !isCompatibleContract(remote.contractVersion)) {
          setStatus({ kind: "incompatible" });
          return;
        }
        handle.current = remote.mount(el.current, latest.current.context);
        setStatus({ kind: "mounted" });
        latest.current.onMounted?.(remote);
      })
      .catch(() => {
        if (!cancelled) setStatus({ kind: "unavailable" });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      handle.current?.unmount();
      handle.current = null;
    };
  }, [attempt, timeoutMs]);

  useEffect(() => {
    handle.current?.update(context);
  }, [context]);

  const retry = () => {
    setStatus({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <>
      {status.kind === "loading" && skeleton}
      {(status.kind === "unavailable" || status.kind === "incompatible") && (
        <div
          role="alert"
          className="mx-auto my-auto flex max-w-md flex-col items-center gap-3 p-6 text-center"
        >
          <p className="text-[15px] leading-relaxed text-foreground">
            {status.kind === "incompatible"
              ? `The ${label.toLowerCase()} is mid-upgrade. Try again in a few minutes.`
              : `The ${label.toLowerCase()} didn't load. It ships separately from the rest of the site, and it isn't answering right now.`}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={retry}>
              Retry
            </Button>
            {aboutHref && status.kind === "unavailable" && (
              <a
                href={aboutHref}
                className="inline-flex h-8 items-center rounded-full border border-border px-3 text-sm text-muted transition-colors hover:text-foreground"
              >
                How this page is built
              </a>
            )}
          </div>
        </div>
      )}
      {/* Always in the tree, so the remote has somewhere to mount the moment
          it arrives; hidden until then so the skeleton owns the space. */}
      <div
        ref={el}
        data-remote={label}
        hidden={status.kind !== "mounted"}
        className={className}
      />
    </>
  );
}
