import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  PROJECTS,
  FEATURES,
  projectFor,
  featureIndexBySlug,
} from "../_data/catalog";

describe("work-portfolio catalog", () => {
  it("exposes 22 features across 10 projects", () => {
    expect(PROJECTS).toHaveLength(10);
    expect(FEATURES).toHaveLength(22);
  });

  it("has unique feature slugs and project ids", () => {
    const slugs = FEATURES.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const ids = PROJECTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every feature belongs to a real project", () => {
    for (const feature of FEATURES) {
      expect(projectFor(feature).id).toBe(feature.projectId);
    }
  });

  it("every project contributes at least one ticker feature", () => {
    for (const project of PROJECTS) {
      expect(
        FEATURES.some((f) => f.projectId === project.id),
        `${project.id} has no features`,
      ).toBe(true);
    }
  });

  it("resolves slugs to indexes and rejects unknown slugs", () => {
    expect(featureIndexBySlug(FEATURES[0].slug)).toBe(0);
    expect(featureIndexBySlug("not-a-feature")).toBeNull();
  });

  it("marks exactly 5 flagship features", () => {
    expect(FEATURES.filter((f) => f.flagship).length).toBe(5);
  });
});

describe("anonymization guard", () => {
  // Real employer and client identifiers must never appear anywhere in the
  // shipped feature. This walks every source file under work-portfolio.
  const BANNED = [
    "helika",
    "pudgy",
    "aradena",
    "artie",
    "rawrshak",
    "bridge-world",
    "bridgeworld",
    "jtm",
  ];

  const root = path.join(__dirname, "..");

  /** Recursively collect source files under the work-portfolio directory. */
  function sourceFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.(ts|tsx|css|json|md)$/.test(entry.name) ? [full] : [];
    });
  }

  it("no banned names appear in any work-portfolio source file", () => {
    for (const file of sourceFiles(root)) {
      // the guard's own banned list lives here, skip scanning this file
      if (file === __filename) continue;
      const content = fs.readFileSync(file, "utf8").toLowerCase();
      for (const banned of BANNED) {
        expect(
          content.includes(banned),
          `"${banned}" found in ${path.relative(root, file)}`,
        ).toBe(false);
      }
    }
  });
});
