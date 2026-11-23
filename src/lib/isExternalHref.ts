/**
 * Whether a link leaves the site. Feature hrefs are either a root-relative
 * path or a full http(s) URL, so the scheme is the whole test.
 */
export function isExternalHref(href: string): boolean {
  return href.startsWith("http");
}
