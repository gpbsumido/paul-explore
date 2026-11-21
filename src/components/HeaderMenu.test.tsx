import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import HeaderMenu from "./HeaderMenu";

// HeaderMenu re-checks auth on route change via usePathname; these tests never
// navigate, so a fixed path is enough.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

/** What /api/me says: signed out unless a name is given. */
function stubMe(name: string | null = null) {
  // A fresh Response per call: a body can only be read once, and the menu
  // refetches on mount, on route change and on focus.
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () =>
      new Response(
        JSON.stringify(
          name
            ? { sub: "auth0|1", name, email: "p@x.com" }
            : { sub: null, name: null, email: null },
        ),
        { status: 200 },
      ),
  );
}

beforeEach(() => stubMe());
afterEach(() => vi.restoreAllMocks());

const renderMenu = (props?: {
  triggerClassName?: string;
  showSettings?: boolean;
  showLogout?: boolean;
}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <HeaderMenu {...props} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("HeaderMenu — Web Vitals is public", () => {
  it("shows the Web Vitals link even when signed out", async () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    const vitals = await screen.findByRole("link", { name: /web vitals/i });
    expect(vitals).toHaveAttribute("href", "/vitals");
  });
});

describe("HeaderMenu trigger styling", () => {
  it("keeps the standard trigger look when no override is given", () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: /open menu/i });
    // Every page that renders the menu without an override (PageHeader, the
    // v1 hero, the v2 nav) relies on this default staying put.
    expect(trigger.className).toContain("rounded-lg");
    expect(trigger.className).toContain("border-border");
  });

  it("lets a caller restyle the trigger without touching the default", () => {
    renderMenu({ triggerClassName: "rounded-full custom-pill" });
    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger.className).toContain("rounded-full");
    expect(trigger.className).toContain("custom-pill");
    expect(trigger.className).not.toContain("rounded-lg");
  });
});

describe("HeaderMenu logged-in greeting", () => {
  it("greets the signed-in user by first name on the trigger", async () => {
    stubMe("Paul Sumido");
    renderMenu();
    expect(await screen.findByText("Hi, Paul")).toBeInTheDocument();
  });

  it("shows no greeting when signed out", async () => {
    renderMenu();
    await screen.findByRole("button", { name: /open menu/i });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText(/^Hi, /)).not.toBeInTheDocument();
  });
});

describe("HeaderMenu account links", () => {
  const openMenu = () =>
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

  it("offers Log out, and not Log in, to a signed-in visitor", async () => {
    stubMe("Paul Sumido");
    renderMenu();
    openMenu();
    expect(await screen.findByRole("link", { name: /log out/i })).toHaveAttribute(
      "href",
      "/auth/logout",
    );
    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
  });

  it("offers Log in, and not Log out, to a signed-out visitor", async () => {
    renderMenu();
    openMenu();
    expect(await screen.findByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/auth/login",
    );
    expect(screen.queryByRole("link", { name: /log out/i })).not.toBeInTheDocument();
  });

  it("leaves the auth link and the session lookup out when showLogout is off", async () => {
    renderMenu({ showLogout: false });
    openMenu();
    await screen.findByRole("link", { name: /settings/i });
    expect(screen.queryByRole("link", { name: /log (in|out)/i })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("hides Settings when the page does not want it", async () => {
    renderMenu({ showSettings: false });
    openMenu();
    await screen.findByRole("link", { name: /log in/i });
    expect(screen.queryByRole("link", { name: /settings/i })).not.toBeInTheDocument();
  });
});

describe("HeaderMenu open and close", () => {
  const trigger = () => screen.getByRole("button", { name: /open menu/i });

  it("closes on Escape", async () => {
    renderMenu();
    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(trigger()).toHaveAttribute("aria-expanded", "false"));
  });

  it("closes when the pointer goes down outside it, but not inside", async () => {
    renderMenu();
    fireEvent.click(trigger());
    fireEvent.mouseDown(screen.getByText("Theme"));
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(trigger()).toHaveAttribute("aria-expanded", "false"));
  });

  it("switches the theme preference from the picker", () => {
    renderMenu();
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
