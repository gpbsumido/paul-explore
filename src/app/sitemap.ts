import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { PUBLIC_ROUTES } from "@/lib/publicRoutes";

/**
 * sitemap.xml.
 *
 * Around sixty of these entries are write-ups, which is the whole reason this
 * is worth having: they are the content most likely to be looked for and the
 * least likely to be stumbled onto by following links from the home page.
 *
 * No lastModified. It would have to be invented — a build timestamp on every
 * URL claims every page changed whenever anything did, which is worse than
 * saying nothing, because a crawler that learns the dates are noise stops
 * trusting them. Priority is left off for the same reason.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: route === "/" ? SITE_URL : `${SITE_URL}${route}`,
  }));
}
