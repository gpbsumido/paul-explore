import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt.
 *
 * The proxy matcher has excluded /robots.txt for as long as it has existed,
 * which is a good sign it was always meant to be here.
 *
 * What is disallowed is not secret — it is the stuff there is no point
 * crawling. The API returns JSON, the /dev pages are skeleton harnesses for
 * building UI, and /settings and /calendar hand an anonymous crawler a login
 * redirect and nothing else. Blocking them keeps the crawl budget on the
 * write-ups, which are the part worth finding.
 *
 * Auth is what protects the private routes. This file is a hint, and a hint is
 * all it has ever been.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dev/", "/settings", "/calendar", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
