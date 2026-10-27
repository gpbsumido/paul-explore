import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mount = vi.fn(() => ({ id: "app" }));
const unmount = vi.fn();

vi.mock("svelte", () => ({ mount, unmount }));
vi.mock("./MindReader.svelte", () => ({ default: { name: "MindReader" } }));
vi.mock("@/components/PageHeader", () => ({ default: () => null }));

import MindReaderContent from "./MindReaderContent";

describe("MindReaderContent", () => {
  it("mounts the Svelte game into the page and tears it down on leave", async () => {
    const { unmount: leave } = render(<MindReaderContent />);

    await waitFor(() => expect(mount).toHaveBeenCalledTimes(1));
    const [component, options] = mount.mock.calls[0] as unknown as [
      unknown,
      { target: HTMLElement },
    ];
    expect(component).toEqual({ name: "MindReader" });
    expect(options.target).toBeInstanceOf(HTMLElement);

    leave();
    expect(unmount).toHaveBeenCalledWith({ id: "app" });
  });

  it("names the page and shows a busy placeholder until the game has mounted", async () => {
    render(<MindReaderContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: /mind reader/i }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByTestId("mind-reader-skeleton")).not.toBeInTheDocument(),
    );
  });
});
