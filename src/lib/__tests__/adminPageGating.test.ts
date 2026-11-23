import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { auth0 } from "@/lib/auth0";
import { INTERVIEWS } from "@/lib/interviewee/interviews.data";
import AdminBetsPage from "@/app/zeroproof/admin/bets/page";
import AdminBetsContent from "@/app/zeroproof/admin/bets/AdminBetsContent";
import EspnLeaguesAdminPage from "@/app/zeroproof/admin/espn-leagues/page";
import AdminEspnLeaguesContent from "@/app/zeroproof/admin/espn-leagues/AdminEspnLeaguesContent";
import IngestHealthAdminPage from "@/app/zeroproof/admin/ingest-health/page";
import AdminIngestHealthContent from "@/app/zeroproof/admin/ingest-health/AdminIngestHealthContent";
import InterviewPage from "@/app/interviewee/[interview]/page";
import InterviewContent from "@/app/interviewee/[interview]/InterviewContent";
import IntervieweeTopicPage from "@/app/interviewee/[interview]/[topic]/page";
import TopicDetail from "@/app/interviewee/[interview]/[topic]/TopicDetail";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
// Only whether the content gets rendered is under test, not the content itself.
vi.mock("@/app/zeroproof/admin/bets/AdminBetsContent", () => ({ default: () => null }));
vi.mock("@/app/zeroproof/admin/espn-leagues/AdminEspnLeaguesContent", () => ({
  default: () => null,
}));
vi.mock("@/app/zeroproof/admin/ingest-health/AdminIngestHealthContent", () => ({
  default: () => null,
}));
vi.mock("@/app/interviewee/[interview]/InterviewContent", () => ({ default: () => null }));
vi.mock("@/app/interviewee/[interview]/[topic]/TopicDetail", () => ({ default: () => null }));

/**
 * Five admin pages gate themselves with isSiteAdmin and nothing else, and
 * until this file no test noticed if that check got loosened to "signed in".
 * Each one should render for my verified address and 404 for anyone else,
 * the same way /to-do does in todoAccess.test.ts.
 */
const OWNER = "owner@example.com";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

// Only the user claims matter to the pages; the token set is not read here.
const signedInAs = (user: { email?: string; email_verified?: boolean } | null) =>
  vi.mocked(auth0.getSession).mockResolvedValue(user ? ({ user } as Session) : null);

const [interview] = INTERVIEWS;
const [topic] = interview.topics;

const ADMIN_PAGES = [
  { name: "/zeroproof/admin/bets", render: () => AdminBetsPage(), content: AdminBetsContent },
  {
    name: "/zeroproof/admin/espn-leagues",
    render: () => EspnLeaguesAdminPage(),
    content: AdminEspnLeaguesContent,
  },
  {
    name: "/zeroproof/admin/ingest-health",
    render: () => IngestHealthAdminPage(),
    content: AdminIngestHealthContent,
  },
  {
    name: "/interviewee/[interview]",
    render: () => InterviewPage({ params: Promise.resolve({ interview: interview.id }) }),
    content: InterviewContent,
  },
  {
    name: "/interviewee/[interview]/[topic]",
    render: () =>
      IntervieweeTopicPage({
        params: Promise.resolve({ interview: interview.id, topic: topic.id }),
      }),
    content: TopicDetail,
  },
];

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", OWNER);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(auth0.getSession).mockReset();
});

describe.each(ADMIN_PAGES)("$name gating", ({ render, content }) => {
  it("renders for the owner's verified address", async () => {
    signedInAs({ email: OWNER, email_verified: true });

    const page = await render();

    expect(page.type).toBe(content);
  });

  it("404s a signed-in visitor who is not on the list", async () => {
    signedInAs({ email: "someone@else.com", email_verified: true });

    await expect(render()).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("404s the owner's address when the provider has not verified it", async () => {
    signedInAs({ email: OWNER, email_verified: false });

    await expect(render()).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});
