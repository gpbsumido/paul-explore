"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import { createInstance } from "@module-federation/runtime";
import type { RemoteModule } from "@paul-portfolio/work-portfolio-contract";
import type { RemoteConfig } from "./remotes";

// This site's React, lent to every remote as a singleton. Next vendors a
// canary build, so the version string is a prerelease; remotes accept that
// with a ^19.0.0-0 range. requiredVersion: false because the host never needs
// someone else's React, it only offers its own.
const shareConfig = { singleton: true, requiredVersion: false } as const;

let instance: ReturnType<typeof createInstance> | null = null;

/** One federation runtime per page, created on first use in the browser. */
function federation() {
  instance ??= createInstance({
    name: "paulExplore",
    remotes: [],
    shared: {
      react: { version: React.version, lib: () => React, shareConfig },
      "react-dom": { version: React.version, lib: () => ReactDOM, shareConfig },
      "react-dom/client": {
        version: React.version,
        lib: () => ReactDOMClient,
        shareConfig,
      },
    },
  });
  return instance;
}

/**
 * Loads a remote's exposed ./mount module. No bundler plugin is involved:
 * Turbopack has no Module Federation support for the App Router, and the
 * runtime doesn't need one. It fetches the manifest, the remote entry and
 * the chunk (plus its CSS), and hands back the module.
 */
export async function loadRemoteModule(
  remote: RemoteConfig,
): Promise<RemoteModule | undefined> {
  const mf = federation();
  mf.registerRemotes([{ name: remote.name, entry: remote.manifestUrl }]);
  return (await mf.loadRemote<RemoteModule>(`${remote.name}/mount`)) ?? undefined;
}
