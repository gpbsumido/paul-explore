"use client";

import { useMemo } from "react";
import type { HostContext } from "@paul-portfolio/work-portfolio-contract";
import RemoteMount from "@/components/RemoteMount/RemoteMount";
import { loadRemoteModule } from "@/lib/mfe/federation";
import { hostServices } from "@/lib/mfe/services";
import type { RemoteConfig } from "@/lib/mfe/remotes";
import { setRemoteRelease } from "./remoteRelease";
import WorkPortfolioSkeleton from "./WorkPortfolioSkeleton";

/** Current ?feature= slug, read once when the remote mounts. */
const featureFromUrl = (): string | null =>
  typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("feature");

/**
 * Keeps ?feature= in step with the remote's selection, the same way the
 * in-repo page always did: replaceState, so arrowing through demos never
 * piles up history.
 */
function writeFeatureToUrl(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug === null) {
    if (!url.searchParams.has("feature")) return;
    url.searchParams.delete("feature");
  } else {
    url.searchParams.set("feature", slug);
  }
  window.history.replaceState(window.history.state, "", url);
}

/**
 * The host's side of the work-portfolio boundary. It owns the URL and data
 * access and lends both to the remote through the contract's HostContext; the
 * remote owns everything drawn inside the stage.
 */
export default function RemoteWorkPortfolio({ remote }: { remote: RemoteConfig }) {
  const context = useMemo<HostContext>(
    () => ({
      initialFeature: featureFromUrl(),
      onFeatureChange: writeFeatureToUrl,
      services: hostServices(),
    }),
    [],
  );

  return (
    <RemoteMount
      label="Work portfolio"
      load={() => loadRemoteModule(remote)}
      context={context}
      skeleton={<WorkPortfolioSkeleton />}
      onMounted={(module) => setRemoteRelease(module.version)}
      aboutHref="/thoughts/micro-frontends"
      className="flex min-h-0 flex-1 flex-col"
    />
  );
}
