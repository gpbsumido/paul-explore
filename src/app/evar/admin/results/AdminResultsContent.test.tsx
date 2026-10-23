import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
import { makeAttempt, makeParticipant, makeStudyExport } from "@/test/factories/evar";
import AdminResultsContent from "./AdminResultsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AdminResultsContent />
    </QueryClientProvider>,
  );

const withExport = (body: JsonBodyType, status = 200) =>
  server.use(http.get("/api/evar/admin/export", () => HttpResponse.json(body, { status })));

const study = makeStudyExport({
  participants: [
    makeParticipant({ id: "p-resident", trainingLevel: "resident" }),
    makeParticipant({ id: "p-student", trainingLevel: "medical-student" }),
  ],
  attempts: [
    makeAttempt({ id: "a1", participantId: "p-resident", level: "medium", caseId: "long-neck" }),
    makeAttempt({ id: "a2", participantId: "p-resident", level: "hard", caseId: "hostile-neck", timedOut: true }),
    makeAttempt({ id: "a3", participantId: "p-student", level: "easy", caseId: "small-sac" }),
  ],
});

const attemptRows = async () => {
  const table = await screen.findByRole("table", { name: /attempts/i });
  return within(table).getAllByRole("row").slice(1);
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("AdminResultsContent", () => {
  it("shows every attempt until a filter narrows it", async () => {
    withExport(study);
    renderPage();
    expect(await attemptRows()).toHaveLength(3);
    expect(screen.getByText("3 attempts from 2 participants")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Level"), { target: { value: "hard" } });
    const rows = await attemptRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(/hostile neck/i);
    expect(rows[0]).toHaveTextContent(/timed out/i);
    expect(screen.getByText("1 attempt from 1 participant")).toBeInTheDocument();
  });

  it("filters by case, training level and timed out", async () => {
    withExport(study);
    renderPage();
    await attemptRows();

    fireEvent.change(screen.getByLabelText("Training level"), { target: { value: "resident" } });
    expect(await attemptRows()).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Timed out"), { target: { value: "no" } });
    expect(await attemptRows()).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    fireEvent.change(screen.getByLabelText("Case"), { target: { value: "small-sac" } });
    const rows = await attemptRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(/medical student/i);
  });

  it("shows the share within tolerance for each measurement", async () => {
    withExport(study);
    renderPage();
    const table = await screen.findByRole("table", { name: /within tolerance by measurement/i });
    const neck = within(table).getByRole("row", { name: /proximal neck diameter/i });
    expect(neck).toHaveTextContent("3 of 3");
    expect(neck).toHaveTextContent("100%");
  });

  it("says when nothing matches, and Clear filters brings everything back", async () => {
    withExport(study);
    renderPage();
    await attemptRows();
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2030-01-01" } });
    expect(await screen.findByText(/no attempts match/i)).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /attempts/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(await attemptRows()).toHaveLength(3);
    expect(screen.getByLabelText("From")).toHaveValue("");
  });

  it("downloads only the attempts the filters leave", async () => {
    const blobs: Blob[] = [];
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn((blob: Blob) => {
        blobs.push(blob);
        return "blob:results";
      }),
      revokeObjectURL: vi.fn(),
    }));
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    withExport(study);
    renderPage();
    await attemptRows();

    fireEvent.change(screen.getByLabelText("Level"), { target: { value: "medium" } });
    fireEvent.click(screen.getByRole("button", { name: /download these as csv/i }));
    const csv = await blobs[0].text();
    expect(csv).toContain("a1");
    expect(csv).not.toContain("a2");
    expect(csv).not.toContain("a3");
  });

  it("says so when the study can't be loaded", async () => {
    withExport({ error: "nope" }, 500);
    renderPage();
    expect(await screen.findByText(/couldn.t load the study data/i)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    withExport(study);
    const { container } = renderPage();
    await attemptRows();
    expect(await axe(container)).toHaveNoViolations();
  });
});
