import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
import { makeAttempt, makeStudyExport } from "@/test/factories/evar";
import StudyData from "./StudyData";

const renderStudyData = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <StudyData />
    </QueryClientProvider>,
  );

const withExport = (body: JsonBodyType, status = 200) =>
  server.use(http.get("/api/evar/admin/export", () => HttpResponse.json(body, { status })));

/** Catches the file the page hands the browser, instead of navigating. */
function captureDownloads() {
  const blobs: Blob[] = [];
  const names: string[] = [];
  vi.stubGlobal("URL", Object.assign(URL, {
    createObjectURL: vi.fn((blob: Blob) => {
      blobs.push(blob);
      return "blob:study";
    }),
    revokeObjectURL: vi.fn(),
  }));
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    names.push(this.download);
  });
  return { blobs, names };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("StudyData", () => {
  it("says how much has been recorded", async () => {
    withExport(makeStudyExport({ attempts: [makeAttempt(), makeAttempt({ id: "a2" })] }));
    renderStudyData();
    expect(await screen.findByText(/2 attempts from 1 participant/i)).toBeInTheDocument();
  });

  it("downloads the study as a CSV, one line per attempt", async () => {
    withExport(makeStudyExport());
    const { blobs, names } = captureDownloads();
    renderStudyData();
    await screen.findByText(/1 attempt from 1 participant/i);
    fireEvent.click(screen.getByRole("button", { name: /download csv/i }));

    expect(names[0]).toMatch(/^evar-study-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(blobs[0].type).toContain("text/csv");
    const lines = (await blobs[0].text()).split("\r\n");
    expect(lines[0]).toMatch(/^participant_id,/);
    expect(lines).toHaveLength(2);
  });

  it("downloads the raw export as JSON", async () => {
    withExport(makeStudyExport());
    const { blobs, names } = captureDownloads();
    renderStudyData();
    await screen.findByText(/1 attempt from 1 participant/i);
    fireEvent.click(screen.getByRole("button", { name: /download json/i }));

    expect(names[0]).toMatch(/\.json$/);
    expect(JSON.parse(await blobs[0].text())).toEqual(makeStudyExport());
  });

  it("has nothing to download before anyone has joined", async () => {
    renderStudyData();
    expect(await screen.findByText(/no attempts recorded yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download csv/i })).toBeDisabled();
  });

  it("says so when the export can't be loaded", async () => {
    withExport({ error: "boom" }, 502);
    renderStudyData();
    expect(await screen.findByText(/couldn't load the study data/i)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    withExport(makeStudyExport());
    const { container } = renderStudyData();
    await screen.findByText(/1 attempt from 1 participant/i);
    expect(await axe(container)).toHaveNoViolations();
  });
});
