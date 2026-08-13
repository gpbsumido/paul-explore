import { createHash } from "node:crypto";

/**
 * Replaces an audit actor's email with a short stable tag.
 *
 * The flags audit log is a public read so the console works signed-out, and
 * each entry names who made the change. In production that is a real allowlisted
 * address -- the same one .env.example deliberately keeps out of the repo,
 * because this repo is public and committing it publishes it to scrapers. An
 * open endpoint handing it out undoes that.
 *
 * A hash rather than a redaction: the log is only useful if you can still see
 * that two changes came from different people, and a plain "***" loses that.
 * Truncated because this identifies actors in a four-entry demo log, not
 * anything that needs collision resistance.
 */
export function maskActor(actor: string | null | undefined): string | null {
  if (!actor) return null;

  const trimmed = actor.trim();
  if (!trimmed.includes("@")) return trimmed;

  const digest = createHash("sha256")
    .update(trimmed.toLowerCase())
    .digest("hex")
    .slice(0, 8);

  return `user-${digest}`;
}
