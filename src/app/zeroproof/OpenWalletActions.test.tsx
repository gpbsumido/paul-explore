import { describe, it, expect } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@paul-portfolio/react";
import { notifyMutationError } from "@/lib/mutationErrorToast";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
import { queryKeys } from "@/lib/queryKeys";
import OpenWalletActions from "./OpenWalletActions";
import type { ZeroproofWallet } from "@/lib/zeroproof/schemas";

const wallet = (
  mode: "season" | "challenge",
  status = "active",
): ZeroproofWallet =>
  ({ id: `w-${mode}`, mode, status }) as unknown as ZeroproofWallet;

const renderActions = (wallets?: ZeroproofWallet[]) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <OpenWalletActions wallets={wallets} />
    </QueryClientProvider>,
  );
  return { ...view, client };
};

/** Answers POST /api/zeroproof/wallets and hands back every body it received. */
const recordOpenRequests = () => {
  const bodies: unknown[] = [];
  server.use(
    http.post("/api/zeroproof/wallets", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ id: "new-wallet" });
    }),
  );
  return bodies;
};

describe("OpenWalletActions", () => {
  it("names both wallet types and explains what each gives and limits", () => {
    renderActions();
    expect(screen.getByRole("heading", { name: /season/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /challenge/i })).toBeInTheDocument();
    // Season opens with a simulated $500 and no deposit today; Challenge is a
    // fixed $100 that can bust.
    expect(screen.getByText(/no deposit needed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$500/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$100/).length).toBeGreaterThan(0);
    expect(screen.getByText(/hit \$0 and it busts/i)).toBeInTheDocument();
    // Both note the 3-month term.
    expect(screen.getAllByText(/term/i).length).toBeGreaterThan(0);
  });

  it("disables the Season button when a season wallet is already active", () => {
    renderActions([wallet("season")]);
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeDisabled();
  });

  it("disables the Challenge button when a challenge wallet is already active", () => {
    renderActions([wallet("challenge")]);
    expect(
      screen.getByRole("button", { name: /open a challenge wallet/i }),
    ).toBeDisabled();
  });

  it("leaves the other button enabled when only one mode is active", () => {
    renderActions([wallet("challenge")]);
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeEnabled();
  });

  it("enables both when no wallet is open", () => {
    renderActions([]);
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /open a challenge wallet/i }),
    ).toBeEnabled();
  });

  it("lets a new wallet be opened once the old one of that mode has busted or been refunded", () => {
    renderActions([wallet("challenge", "busted"), wallet("season", "refunded")]);
    expect(
      screen.getByRole("button", { name: /open a challenge wallet/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeEnabled();
    expect(screen.queryByText(/already have an active/i)).not.toBeInTheDocument();
  });

  it.each([
    [[wallet("season")], "You already have an active season wallet."],
    [[wallet("challenge")], "You already have an active challenge wallet."],
    [
      [wallet("season"), wallet("challenge")],
      "You already have an active season and challenge wallet.",
    ],
  ])("says which wallet is already open (%#)", (wallets, message) => {
    renderActions(wallets);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("opens a Season wallet with the fixed $500 deposit in cents", async () => {
    const bodies = recordOpenRequests();
    renderActions([]);

    await userEvent.click(
      screen.getByRole("button", { name: /open a season wallet/i }),
    );

    await waitFor(() =>
      expect(bodies).toEqual([{ mode: "season", depositCents: 50_000 }]),
    );
  });

  it("opens a Challenge wallet without sending a deposit", async () => {
    const bodies = recordOpenRequests();
    renderActions([]);

    await userEvent.click(
      screen.getByRole("button", { name: /open a challenge wallet/i }),
    );

    await waitFor(() => expect(bodies).toEqual([{ mode: "challenge" }]));
  });

  it("locks both buttons while a wallet is being opened, so a double click cannot open two", async () => {
    let finish: () => void = () => {};
    const bodies: unknown[] = [];
    server.use(
      http.post("/api/zeroproof/wallets", async ({ request }) => {
        bodies.push(await request.json());
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        return HttpResponse.json({ id: "new-wallet" });
      }),
    );
    renderActions([]);
    const season = screen.getByRole("button", { name: /open a season wallet/i });
    const challenge = screen.getByRole("button", {
      name: /open a challenge wallet/i,
    });

    await userEvent.click(season);

    await waitFor(() => expect(season).toBeDisabled());
    expect(challenge).toBeDisabled();
    await userEvent.click(season);
    finish();
    await waitFor(() => expect(season).toBeEnabled());
    expect(bodies).toHaveLength(1);
  });

  it("refreshes the lobby data after a wallet opens, so the new wallet shows up", async () => {
    recordOpenRequests();
    const { client } = renderActions([]);
    client.setQueryData(queryKeys.zeroproof.me(), { wallets: [] });

    await userEvent.click(
      screen.getByRole("button", { name: /open a season wallet/i }),
    );

    await waitFor(() =>
      expect(client.getQueryState(queryKeys.zeroproof.me())?.isInvalidated).toBe(
        true,
      ),
    );
  });

  it("leaves the lobby data alone when the wallet could not be opened", async () => {
    server.use(
      http.post("/api/zeroproof/wallets", () =>
        HttpResponse.json({ error: "Deposit too small" }, { status: 400 }),
      ),
    );
    const { client } = renderActions([]);
    client.setQueryData(queryKeys.zeroproof.me(), { wallets: [] });

    await userEvent.click(
      screen.getByRole("button", { name: /open a season wallet/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /open a season wallet/i }),
      ).toBeEnabled(),
    );

    expect(client.getQueryState(queryKeys.zeroproof.me())?.isInvalidated).toBe(
      false,
    );
  });

  // The component raises no message of its own: a failed write rides the
  // app-wide MutationCache handler (providers.tsx), so this wires the same
  // pieces and checks the server's reason reaches the visitor.
  it("tells the visitor why the wallet could not be opened, through the app-wide toast", async () => {
    server.use(
      http.post("/api/zeroproof/wallets", () =>
        HttpResponse.json({ error: "Deposit too small" }, { status: 400 }),
      ),
    );
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) =>
          notifyMutationError(error, mutation.meta),
      }),
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <OpenWalletActions wallets={[]} />
        <Toaster />
      </QueryClientProvider>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /open a season wallet/i }),
    );

    expect(await screen.findByText(/deposit too small/i)).toBeInTheDocument();
    act(() => {
      document
        .querySelectorAll(".toast__dismiss")
        .forEach((button) => (button as HTMLElement).click());
    });
  });

  it("has no a11y violations", async () => {
    const { container } = renderActions([]);
    expect(await axe(container)).toHaveNoViolations();
  });
});
