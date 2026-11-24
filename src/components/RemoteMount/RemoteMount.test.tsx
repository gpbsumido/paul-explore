import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import {
  CONTRACT_VERSION,
  type HostContext,
  type MountHandle,
  type RemoteModule,
} from "@paul-portfolio/work-portfolio-contract";
import RemoteMount from "./RemoteMount";

afterEach(() => vi.useRealTimers());

const context = (): HostContext => ({
  initialFeature: null,
  onFeatureChange: vi.fn(),
  services: {
    referrals: {
      create: vi.fn(),
      stats: vi.fn(),
      recordClick: vi.fn(),
    },
  },
});

/** A remote that renders a marker into whatever element it is given. */
const fakeRemote = (overrides: Partial<RemoteModule> = {}) => {
  const handle: MountHandle = { update: vi.fn(), unmount: vi.fn() };
  const remote: RemoteModule = {
    contractVersion: CONTRACT_VERSION,
    version: "1.4.0",
    mount: vi.fn((el: HTMLElement) => {
      el.textContent = "remote content";
      return handle;
    }),
    ...overrides,
  };
  return { remote, handle };
};

const renderMount = (
  load: () => Promise<RemoteModule | undefined>,
  extra: {
    onMounted?: (remote: RemoteModule) => void;
    timeoutMs?: number;
    aboutHref?: string;
  } = {},
) => {
  const ctx = context();
  const utils = render(
    <RemoteMount
      label="Work portfolio"
      load={load}
      context={ctx}
      skeleton={<p>loading skeleton</p>}
      {...extra}
    />,
  );
  return { ctx, ...utils };
};

describe("RemoteMount", () => {
  it("shows the skeleton while the remote loads", () => {
    renderMount(() => new Promise(() => {}));
    expect(screen.getByText("loading skeleton")).toBeInTheDocument();
  });

  it("mounts the loaded module into its element with the host context", async () => {
    const { remote } = fakeRemote();
    const onMounted = vi.fn();
    const { ctx } = renderMount(() => Promise.resolve(remote), { onMounted });

    expect(await screen.findByText("remote content")).toBeInTheDocument();
    expect(remote.mount).toHaveBeenCalledWith(expect.any(HTMLElement), ctx);
    expect(onMounted).toHaveBeenCalledWith(remote);
    expect(screen.queryByText("loading skeleton")).toBeNull();
  });

  it("shows the unavailable fallback when the remote fails to load", async () => {
    renderMount(() => Promise.reject(new Error("Failed to get manifest")));
    expect(await screen.findByText(/didn't load/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("gives up and shows the fallback when the remote takes too long", async () => {
    vi.useFakeTimers();
    renderMount(() => new Promise(() => {}), { timeoutMs: 8000 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(screen.getByText(/didn't load/i)).toBeInTheDocument();
  });

  it("refuses a remote built against another contract major", async () => {
    const { remote } = fakeRemote({ contractVersion: CONTRACT_VERSION + 1 });
    renderMount(() => Promise.resolve(remote));
    expect(await screen.findByText(/mid-upgrade/i)).toBeInTheDocument();
    expect(remote.mount).not.toHaveBeenCalled();
  });

  it("retries the load and mounts when the second attempt works", async () => {
    const { remote } = fakeRemote();
    const load = vi
      .fn<() => Promise<RemoteModule | undefined>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(remote);
    renderMount(load);

    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));

    expect(await screen.findByText("remote content")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("unmounts the remote when it leaves the page", async () => {
    const { remote, handle } = fakeRemote();
    const { unmount } = renderMount(() => Promise.resolve(remote));
    await screen.findByText("remote content");

    unmount();

    expect(handle.unmount).toHaveBeenCalledTimes(1);
  });

  it("treats a remote that resolves to nothing as mid-upgrade", async () => {
    renderMount(() => Promise.resolve(undefined));
    expect(await screen.findByText(/mid-upgrade/i)).toBeInTheDocument();
  });

  it("hands a new context to the mounted remote instead of remounting it", async () => {
    const { remote, handle } = fakeRemote();
    const { rerender, ctx } = renderMount(() => Promise.resolve(remote));
    await screen.findByText("remote content");

    const nextContext = context();
    rerender(
      <RemoteMount
        label="Work portfolio"
        load={() => Promise.resolve(remote)}
        context={nextContext}
        skeleton={<p>loading skeleton</p>}
      />,
    );

    expect(handle.update).toHaveBeenLastCalledWith(nextContext);
    expect(handle.update).not.toHaveBeenCalledWith(ctx);
    expect(remote.mount).toHaveBeenCalledTimes(1);
  });

  it("links to how the page is built when the load fails, but not when the contract is wrong", async () => {
    renderMount(() => Promise.reject(new Error("offline")), {
      aboutHref: "/thoughts/work-portfolio",
    });
    expect(
      await screen.findByRole("link", { name: /how this page is built/i }),
    ).toHaveAttribute("href", "/thoughts/work-portfolio");
  });

  it("leaves out the how-it-is-built link on a contract mismatch", async () => {
    const { remote } = fakeRemote({ contractVersion: CONTRACT_VERSION + 1 });
    renderMount(() => Promise.resolve(remote), {
      aboutHref: "/thoughts/work-portfolio",
    });
    await screen.findByText(/mid-upgrade/i);
    expect(
      screen.queryByRole("link", { name: /how this page is built/i }),
    ).not.toBeInTheDocument();
  });

  it("does not mount a remote that arrives after the page has gone", async () => {
    const { remote } = fakeRemote();
    let arrive: (loaded: RemoteModule) => void = () => {};
    const { unmount } = renderMount(
      () => new Promise<RemoteModule>((resolve) => (arrive = resolve)),
    );

    unmount();
    await act(async () => arrive(remote));

    expect(remote.mount).not.toHaveBeenCalled();
  });

  it("goes back to the skeleton while a retry is in flight", async () => {
    const load = vi
      .fn<() => Promise<RemoteModule | undefined>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockReturnValueOnce(new Promise(() => {}));
    renderMount(load);

    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));

    expect(screen.getByText("loading skeleton")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ignores a slow attempt that finally answers after a retry took over", async () => {
    vi.useFakeTimers();
    const stale = fakeRemote();
    const fresh = fakeRemote();
    let arriveLate: (loaded: RemoteModule) => void = () => {};
    const load = vi
      .fn<() => Promise<RemoteModule | undefined>>()
      .mockReturnValueOnce(new Promise((resolve) => (arriveLate = resolve)))
      .mockResolvedValueOnce(fresh.remote);
    renderMount(load, { timeoutMs: 1000 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => arriveLate(stale.remote));

    expect(fresh.remote.mount).toHaveBeenCalledTimes(1);
    expect(stale.remote.mount).not.toHaveBeenCalled();
  });
});
