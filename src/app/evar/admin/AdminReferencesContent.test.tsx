import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
import { EVAR_CASES } from "@/lib/evar/phantom";
import { parseManifest } from "@/lib/evar/scans";
import manifest from "../../../../public/evar/scans/manifest.json";

const [realScan] = parseManifest(manifest, "/evar/scans");
import AdminReferencesContent from "./AdminReferencesContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const [longNeck, shortNeck] = EVAR_CASES;

/** The API with one hand-set case, recording what the form sends. */
function api() {
  const state = {
    references: [
      {
        caseId: shortNeck.id,
        neckDiameter: 26,
        neckLength: 12,
        maxSac: 58,
        rightCia: 22,
        leftCia: 18,
        note: "From the 3D reconstruction",
        updatedAt: "2026-10-22T10:00:00.000Z",
      },
    ],
    puts: [] as { caseId: string; body: Record<string, unknown> }[],
    deletes: [] as string[],
  };
  server.use(
    http.get("/api/evar/references", () => HttpResponse.json({ references: state.references })),
    http.put("/api/evar/admin/references/:caseId", async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      state.puts.push({ caseId: String(params.caseId), body });
      return HttpResponse.json({ reference: { caseId: params.caseId, ...body, updatedAt: "2026-10-22T11:00:00.000Z" } });
    }),
    http.delete("/api/evar/admin/references/:caseId", ({ params }) => {
      state.deletes.push(String(params.caseId));
      state.references = state.references.filter((r) => r.caseId !== params.caseId);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return state;
}

const renderAdmin = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AdminReferencesContent />
    </QueryClientProvider>,
  );

/** A case's form only exists once its row is opened, so there aren't hundreds of forms on the page. */
const openCase = async (title: string) => {
  fireEvent.click(await screen.findByRole("button", { name: new RegExp(`^${title}`) }));
  return screen.getByRole("group", { name: new RegExp(title) });
};
const caseGroup = (title: string) => screen.getByRole("group", { name: new RegExp(title) });

describe("AdminReferencesContent", () => {
  it("shows each case's current values and where they came from", async () => {
    api();
    renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${shortNeck.title}`) });

    const hand = await openCase(shortNeck.title);
    expect(within(hand).getByDisplayValue("From the 3D reconstruction")).toBeInTheDocument();
    expect(within(hand).getByText(/set by hand/i)).toBeInTheDocument();
    expect(within(hand).getByRole("spinbutton", { name: /neck diameter/i })).toHaveValue(26);

    const phantom = await openCase(longNeck.title);
    expect(within(phantom).getByText(/phantom geometry/i)).toBeInTheDocument();
    expect(within(phantom).queryByRole("button", { name: /reset/i })).toBeNull();
  });

  it("lists the real case with empty answers to fill in, and no phantom to fall back to", async () => {
    api();
    renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${shortNeck.title}`) });
    const real = await openCase(realScan.title);
    expect(within(real).getByText(/no answers yet/i)).toBeInTheDocument();
    expect(within(real).getByRole("spinbutton", { name: /neck diameter/i })).toHaveValue(null);
    expect(within(real).queryByRole("button", { name: /reset/i })).toBeNull();
  });

  it("saves all five values and the note for one case", async () => {
    const state = api();
    renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${shortNeck.title}`) });

    const group = await openCase(longNeck.title);
    fireEvent.change(within(group).getByRole("spinbutton", { name: /neck diameter/i }), { target: { value: "25" } });
    fireEvent.change(within(group).getByRole("textbox", { name: /note/i }), { target: { value: "Checked by hand" } });
    fireEvent.click(within(group).getByRole("button", { name: /save/i }));

    await waitFor(() => expect(state.puts).toHaveLength(1));
    expect(state.puts[0].caseId).toBe(longNeck.id);
    expect(state.puts[0].body).toMatchObject({ neckDiameter: 25, note: "Checked by hand" });
    expect(Object.keys(state.puts[0].body).sort()).toEqual(
      ["leftCia", "maxSac", "neckDiameter", "neckLength", "note", "rightCia"],
    );
    expect(await within(group).findByText(/saved/i)).toBeInTheDocument();
  });

  it("won't save an empty or non-positive value", async () => {
    const state = api();
    renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${shortNeck.title}`) });

    const group = await openCase(longNeck.title);
    fireEvent.change(within(group).getByRole("spinbutton", { name: /max sac/i }), { target: { value: "" } });
    expect(within(group).getByRole("button", { name: /save/i })).toBeDisabled();
    expect(state.puts).toHaveLength(0);
  });

  it("resets a hand-set case back to the phantom", async () => {
    const state = api();
    renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${shortNeck.title}`) });

    fireEvent.click(within(await openCase(shortNeck.title)).getByRole("button", { name: /reset to phantom/i }));
    await waitFor(() => expect(state.deletes).toEqual([shortNeck.id]));
    expect(await within(caseGroup(shortNeck.title)).findByText(/phantom geometry/i)).toBeInTheDocument();
  });

  it("only builds a case's form once its row is opened", async () => {
    api();
    renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${longNeck.title}`) });
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
    await openCase(longNeck.title);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(5);
  });

  it("finds a case by searching for it", async () => {
    api();
    renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${longNeck.title}`) });
    fireEvent.change(screen.getByRole("searchbox", { name: /find a case/i }), { target: { value: "hostile" } });
    expect(screen.getByRole("button", { name: /^hostile neck/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: new RegExp(`^${longNeck.title}`) })).toBeNull();
  });

  it("can narrow the list to cases that still need answers", async () => {
    api();
    renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${realScan.title}`) });
    fireEvent.click(screen.getByRole("checkbox", { name: /only cases that need answers/i }));
    expect(screen.getByRole("button", { name: new RegExp(`^${realScan.title}`) })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: new RegExp(`^${longNeck.title}`) })).toBeNull();
    expect(screen.queryByRole("button", { name: new RegExp(`^${shortNeck.title}`) })).toBeNull();
  });

  it("puts the study data above the reference forms", async () => {
    api();
    renderAdmin();
    expect(await screen.findByRole("heading", { name: /study data/i })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    api();
    const { container } = renderAdmin();
    await screen.findByRole("button", { name: new RegExp(`^${shortNeck.title}`) });
    expect(await axe(container)).toHaveNoViolations();
  });
});
