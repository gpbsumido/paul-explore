import { test, expect } from "@playwright/test";
import { PATTERNS } from "../../src/lib/leetcode/patterns";

/**
 * Every ladder problem links to leetcode.com/problems/<slug>, and nothing in
 * the unit suite can tell whether that slug still exists, since those tests
 * never touch the network. LeetCode renames and retires problems, and a dead
 * link on a study page fails quietly: the page renders fine and the 404 only
 * shows up mid-session.
 *
 * This asks LeetCode's GraphQL endpoint for each slug, about forty to a
 * request with aliases, and checks the title and difficulty too, since the
 * page prints both. It has no @smoke tag, so it runs in the nightly and
 * pre-release suite rather than on every PR: a red build because LeetCode was
 * slow or rate-limited a runner would cost more than a dead link costs.
 */

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";
const SLUGS_PER_REQUEST = 40;

type LeetCodeQuestion = { title: string; difficulty: string } | null;

test("every ladder problem still names a real LeetCode problem", async ({ request }) => {
  const problems = PATTERNS.flatMap((pattern) => pattern.problems);
  const batches = Array.from({ length: Math.ceil(problems.length / SLUGS_PER_REQUEST) }, (_, i) =>
    problems.slice(i * SLUGS_PER_REQUEST, (i + 1) * SLUGS_PER_REQUEST),
  );
  const mismatches: string[] = [];

  for (const batch of batches) {
    const fields = batch.map((problem, i) => `q${i}: question(titleSlug: ${JSON.stringify(problem.slug)}) { title difficulty }`);
    const response = await request.post(LEETCODE_GRAPHQL, {
      data: { query: `query { ${fields.join(" ")} }` },
      headers: { referer: "https://leetcode.com" },
    });
    expect(response.ok(), `LeetCode answered ${response.status()}`).toBe(true);
    const { data } = (await response.json()) as { data: Record<string, LeetCodeQuestion> };

    batch.forEach((problem, i) => {
      const question = data[`q${i}`];
      if (!question) mismatches.push(`${problem.slug}: LeetCode has no such problem`);
      else if (question.title !== problem.title) mismatches.push(`${problem.slug}: LeetCode calls it "${question.title}", the page says "${problem.title}"`);
      else if (question.difficulty !== problem.difficulty) mismatches.push(`${problem.slug}: LeetCode says ${question.difficulty}, the page says ${problem.difficulty}`);
    });
  }

  expect(mismatches).toEqual([]);
});
