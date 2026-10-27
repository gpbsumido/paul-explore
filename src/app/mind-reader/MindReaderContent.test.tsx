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

  it("joins the room in the link as player B, and ignores a code that isn't one", async () => {
    mount.mockClear();
    window.history.pushState({}, "", "/mind-reader?room=K7QX3");
    const first = render(<MindReaderContent />);
    await waitFor(() => expect(mount).toHaveBeenCalledTimes(1));
    const [, joined] = mount.mock.calls[0] as unknown as [
      unknown,
      { props: { joinCode?: string; connect: unknown } },
    ];
    expect(joined.props.joinCode).toBe("K7QX3");
    expect(joined.props.connect).toEqual(expect.any(Function));
    first.unmount();

    window.history.pushState({}, "", "/mind-reader?room=*");
    render(<MindReaderContent />);
    await waitFor(() => expect(mount).toHaveBeenCalledTimes(2));
    const [, solo] = mount.mock.calls[1] as unknown as [
      unknown,
      { props: { joinCode?: string } },
    ];
    expect(solo.props.joinCode).toBeUndefined();
    window.history.pushState({}, "", "/mind-reader");
  });
});
