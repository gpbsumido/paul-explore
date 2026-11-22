import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SESSION_PROTECTED_PREFIXES } from "@/lib/protectedPaths";

/**
 * robots.txt.
 *
 * The proxy matcher has excluded /robots.txt for as long as it has existed,
 * which is a good sign it was always meant to be here.
 *
 * What is disallowed is not secret — it is the stuff there is no point
 * crawling. The API returns JSON, the /dev pages are skeleton harnesses for
 * building UI, and every session-protected prefix hands an anonymous crawler a
 * login redirect and nothing else. Those come from the list the proxy enforces,
 * because a hand-kept copy here missed five of them. Blocking them keeps the
 * crawl budget on the write-ups, which are the part worth finding.
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
        disallow: ["/api/", "/dev/", "/auth/", ...SESSION_PROTECTED_PREFIXES],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
