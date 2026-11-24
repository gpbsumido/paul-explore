import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { evarRedirects } from "@/lib/evarRedirects";

/**
 * Every write-up is prose, and prose links to things: the feature it is about,
 * another write-up, a dated update further down the same page. None of those
 * links is checked by anything else, so a renamed route or a deleted update
 * leaves a link that looks fine and goes nowhere.
 *
 * This reads the write-up sources rather than rendering each page. That keeps
 * it cheap enough to cover all of them, including the ones with no test of
 * their own, and it only looks at links written as plain string literals.
 */
const ROOT = process.cwd();
const APP = join(ROOT, "src", "app");
const THOUGHTS = join(APP, "thoughts");
const PUBLIC = join(ROOT, "public");

/** Every source file under a folder, excluding tests. */
const sourcesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourcesUnder(path);
    return /\.(tsx|ts)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

/**
 * Whether a URL path lands on a page. Route groups like (app) do not appear in
 * the URL, and a [param] folder matches any one segment.
 */
const routeResolves = (dir: string, segments: string[]): boolean => {
  const children = readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory());

  if (segments.length === 0) {
    if (existsSync(join(dir, "page.tsx"))) return true;
    return children
      .filter((name) => /^\(.*\)$/.test(name))
      .some((group) => routeResolves(join(dir, group), segments));
  }

  const [head, ...rest] = segments;
  return children.some((name) => {
    if (/^\(.*\)$/.test(name)) return routeResolves(join(dir, name), segments);
    if (name === head) return routeResolves(join(dir, name), rest);
    if (/^\[\.\.\..*\]$/.test(name)) return existsSync(join(dir, name, "page.tsx"));
    if (/^\[.*\]$/.test(name)) return routeResolves(join(dir, name), rest);
    return false;
  });
};

/** Old paths that next.config sends elsewhere, so a link to one still lands. */
const isRedirected = (path: string): boolean =>
  evarRedirects().some(({ source }) => {
    if (!source.endsWith("/:path*")) return source === path;
    const prefix = source.slice(0, -"/:path*".length);
    return path === prefix || path.startsWith(`${prefix}/`);
  });

const pathResolves = (path: string): boolean => {
  if (path === "/") return true;
  if (isRedirected(path)) return true;
  if (path.startsWith("/api/")) return true;
  if (existsSync(join(PUBLIC, path))) return true;
  return routeResolves(APP, path.split("/").filter(Boolean));
};

/** Whether the id is written anywhere in these files, as an id attribute or a string. */
const idDefinedIn = (files: string[], id: string): boolean =>
  files.some((file) => {
    const text = readFileSync(file, "utf-8");
    return text.includes(`"${id}"`) || text.includes(`'${id}'`) || text.includes(`\`${id}\``);
  });

type FoundLink = { file: string; href: string };

const LITERAL_HREF = /href=(?:"([^"]+)"|\{"([^"]+)"\})/g;

const linksIn = (files: string[]): FoundLink[] =>
  files.flatMap((file) => {
    const text = readFileSync(file, "utf-8");
    return [...text.matchAll(LITERAL_HREF)].map((match) => ({
      file: relative(ROOT, file),
      href: match[1] ?? match[2],
    }));
  });

const writeUpFiles = sourcesUnder(THOUGHTS);
const internalLinks = linksIn(writeUpFiles).filter(({ href }) => href.startsWith("/") || href.startsWith("#"));

describe("links inside the write-ups", () => {
  it("found the links it claims to be checking", () => {
    expect(writeUpFiles.length).toBeGreaterThan(100);
    expect(internalLinks.length).toBeGreaterThan(100);
  });

  it("every site link points at a page that exists", () => {
    const dead = internalLinks
      .filter(({ href }) => href.startsWith("/"))
      .filter(({ href }) => !pathResolves(href.split(/[?#]/)[0]))
      .map(({ file, href }) => `${file} -> ${href}`);

    expect(dead).toEqual([]);
  });

  it("every #anchor on the same page matches an id on that page", () => {
    const anchors = internalLinks.filter(({ href }) => href.startsWith("#") && href.length > 1);
    expect(anchors.length).toBeGreaterThan(20);

    const dead = anchors
      .filter(({ file, href }) => {
        // A write-up is a folder of files, so the id may live in a sibling section.
        const writeUpFolder = join(THOUGHTS, relative(THOUGHTS, join(ROOT, file)).split("/")[0]);
        return !idDefinedIn(sourcesUnder(writeUpFolder), href.slice(1));
      })
      .map(({ file, href }) => `${file} -> ${href}`);

    expect(dead).toEqual([]);
  });
});
