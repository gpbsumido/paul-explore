import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WallsPanel from "./WallsPanel";
import { initialGalleryState, type GalleryState } from "./_lib/state";

vi.mock("./_lib/walls-api", () => ({
  listWalls: vi.fn(),
  getWall: vi.fn(),
  createWall: vi.fn(),
  updateWall: vi.fn(),
  deleteWall: vi.fn(),
}));

import {
  listWalls,
  getWall,
  createWall,
  updateWall,
  deleteWall,
} from "./_lib/walls-api";

const seeded: GalleryState = {
  ...initialGalleryState,
  images: [
    {
      id: "img0",
      src: "blob:a",
      aspect: 1,
      frame: { sizeId: "8x10", orientation: "portrait" },
    },
  ],
};

/** The per-wall actions now live behind a menu, so open it first. */
const openMenu = async (name: string) => {
  fireEvent.click(
    await screen.findByRole("button", { name: new RegExp(`actions for ${name}`, "i") }),
  );
};

const renderPanel = (overrides: Partial<React.ComponentProps<typeof WallsPanel>> = {}) =>
  render(
    <WallsPanel
      state={seeded}
      getFiles={() => ({})}
      canSave
      onOpen={vi.fn()}
      onNew={vi.fn()}
      {...overrides}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listWalls).mockResolvedValue([
    { id: "w1", name: "Hallway", updatedAt: "2026-07-28T00:00:00.000Z" },
  ]);
  vi.mocked(getWall).mockResolvedValue({
    id: "w1",
    name: "Hallway",
    state: seeded,
    createdAt: "t",
    updatedAt: "t",
  });
  vi.mocked(createWall).mockResolvedValue({ id: "w2", name: "Den", updatedAt: "t" });
  vi.mocked(updateWall).mockResolvedValue({ id: "w1", name: "Hallway", updatedAt: "t2" });
  vi.mocked(deleteWall).mockResolvedValue(undefined);
});

describe("WallsPanel", () => {
  it("lists the saved walls on mount", async () => {
    renderPanel();
    expect(
      await screen.findByRole("button", { name: /actions for hallway/i }),
    ).toBeInTheDocument();
  });

  it("keeps each wall's actions behind one menu", async () => {
    renderPanel();
    await openMenu("hallway");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /open hallway/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /rename hallway/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /delete hallway/i })).toBeInTheDocument();
  });

  it("opens a saved wall and hands its state back", async () => {
    const onOpen = vi.fn();
    renderPanel({ onOpen });
    await openMenu("hallway");
    fireEvent.click(screen.getByRole("menuitem", { name: /open hallway/i }));
    await waitFor(() => expect(onOpen).toHaveBeenCalledWith(seeded));
  });

  it("saves a new wall under a name typed by the user", async () => {
    renderPanel();
    await screen.findByRole("button", { name: /actions for hallway/i });
    fireEvent.change(screen.getByLabelText(/wall name/i), {
      target: { value: "Den" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(createWall).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Den", state: seeded }),
      ),
    );
  });

  it("updates the wall that is currently open instead of creating another", async () => {
    renderPanel();
    await openMenu("hallway");
    fireEvent.click(screen.getByRole("menuitem", { name: /open hallway/i }));
    await waitFor(() => expect(getWall).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(updateWall).toHaveBeenCalledWith("w1", expect.anything()));
    expect(createWall).not.toHaveBeenCalled();
  });

  it("renames a saved wall", async () => {
    renderPanel();
    await openMenu("hallway");
    fireEvent.click(screen.getByRole("menuitem", { name: /rename hallway/i }));
    const input = screen.getByLabelText(/new name for hallway/i);
    fireEvent.change(input, { target: { value: "Stairwell" } });
    fireEvent.click(screen.getByRole("button", { name: /^confirm rename$/i }));
    await waitFor(() =>
      expect(updateWall).toHaveBeenCalledWith("w1", expect.objectContaining({ name: "Stairwell" })),
    );
  });

  it("deletes a saved wall after confirming", async () => {
    renderPanel();
    await openMenu("hallway");
    fireEvent.click(screen.getByRole("menuitem", { name: /delete hallway/i }));
    fireEvent.click(screen.getByRole("button", { name: /^confirm delete$/i }));
    await waitFor(() => expect(deleteWall).toHaveBeenCalledWith("w1"));
  });

  it("starts a new wall, clearing the open one", async () => {
    const onNew = vi.fn();
    renderPanel({ onNew });
    fireEvent.click(await screen.findByRole("button", { name: /new wall/i }));
    expect(onNew).toHaveBeenCalled();
  });

  it("blocks saving while the arrangement is invalid", async () => {
    renderPanel({ canSave: false });
    await screen.findByRole("button", { name: /actions for hallway/i });
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
  });

  it("surfaces an error when the save fails", async () => {
    vi.mocked(createWall).mockRejectedValue(new Error("Backend unavailable"));
    renderPanel();
    await screen.findByRole("button", { name: /actions for hallway/i });
    fireEvent.change(screen.getByLabelText(/wall name/i), { target: { value: "Den" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/backend unavailable/i);
  });

  it("shows an empty state when nothing is saved yet", async () => {
    vi.mocked(listWalls).mockResolvedValue([]);
    renderPanel();
    expect(await screen.findByText(/no saved walls/i)).toBeInTheDocument();
  });
});
