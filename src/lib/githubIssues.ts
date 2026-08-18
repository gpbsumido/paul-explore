/**
 * The slice of the GitHub REST API this app needs to keep exactly one alert
 * issue in sync with the current state of the Web Vitals: find the open one,
 * open a new one, update its body, or close it on recovery.
 *
 * Deliberately tiny and dependency-free (plain fetch) so it can run from a
 * Vercel Cron function without dragging in an SDK, and so the route that uses
 * it stays flat.
 */

const GITHUB_API = "https://api.github.com";

/** A reference to an issue we might update or close. */
export type IssueRef = { number: number };

type Auth = { repo: string; token: string };

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "paul-explore-vitals-alert",
  };
}

async function ensureOk(res: Response, action: string): Promise<Response> {
  if (!res.ok) {
    throw new Error(`GitHub ${action} failed: ${res.status}`);
  }
  return res;
}

/**
 * Returns the first open issue carrying the label, or null when there is none.
 * That issue, if present, is the live alert we update or close.
 */
export async function findOpenIssue({
  repo,
  token,
  label,
}: Auth & { label: string }): Promise<IssueRef | null> {
  const url = `${GITHUB_API}/repos/${repo}/issues?state=open&labels=${encodeURIComponent(label)}`;
  const res = await ensureOk(
    await fetch(url, { headers: headers(token) }),
    "list issues",
  );
  const issues = (await res.json()) as Array<{ number: number }>;
  const first = Array.isArray(issues) ? issues[0] : undefined;
  return first ? { number: first.number } : null;
}

/** Opens a new labelled issue and returns its number. */
export async function createIssue({
  repo,
  token,
  title,
  body,
  label,
}: Auth & { title: string; body: string; label: string }): Promise<IssueRef> {
  const res = await ensureOk(
    await fetch(`${GITHUB_API}/repos/${repo}/issues`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ title, body, labels: [label] }),
    }),
    "create issue",
  );
  const created = (await res.json()) as { number: number };
  return { number: created.number };
}

/** Rewrites the body of the existing alert issue with the latest snapshot. */
export async function updateIssue({
  repo,
  token,
  number,
  body,
}: Auth & { number: number; body: string }): Promise<void> {
  await ensureOk(
    await fetch(`${GITHUB_API}/repos/${repo}/issues/${number}`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ body }),
    }),
    "update issue",
  );
}

/** Leaves a recovery comment then closes the issue. */
export async function closeIssue({
  repo,
  token,
  number,
  comment,
}: Auth & { number: number; comment: string }): Promise<void> {
  await ensureOk(
    await fetch(`${GITHUB_API}/repos/${repo}/issues/${number}/comments`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ body: comment }),
    }),
    "comment on issue",
  );
  await ensureOk(
    await fetch(`${GITHUB_API}/repos/${repo}/issues/${number}`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ state: "closed" }),
    }),
    "close issue",
  );
}
