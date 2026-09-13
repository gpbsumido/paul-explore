import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import DesignSystemShowcaseContent from "./DesignSystemShowcaseContent";
import { COMPONENTS, spotlightFor } from "./catalog";
import { MOTION_PRIMITIVES } from "./motionPrimitives";

// PageHeader pulls in HeaderMenu which fetches /api/me; the showcase itself is
// what we're testing, so stub the shared header the way the thoughts index test
// does.
vi.mock("@/components/PageHeader", () => ({ default: () => null }));

// Render as a returning visitor by default so the first-run tour doesn't
// auto-open over assertions that aren't about it. The tour's own tests below
// drive it explicitly.
beforeEach(() =>
  window.localStorage.setItem("design-system-tour-seen", "true"),
);

describe("DesignSystemShowcaseContent", () => {
  it("leads with a single design system heading", () => {
    render(<DesignSystemShowcaseContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: /design system/i }),
    ).toBeInTheDocument();
  });

  it("renders a gallery card for every documented primitive", () => {
    render(<DesignSystemShowcaseContent />);
    for (const component of COMPONENTS) {
      expect(
        screen.getByRole("heading", { level: 3, name: component.name }),
      ).toBeInTheDocument();
    }
  });

  it("links each component to a page where it ships", () => {
    render(<DesignSystemShowcaseContent />);
    const calendarLinks = screen.getAllByRole("link", { name: "Calendar" });
    expect(calendarLinks.length).toBeGreaterThan(0);
    expect(calendarLinks[0]).toHaveAttribute("href", "/calendar");
  });

  describe("Button playground", () => {
    it("shows the minimal snippet for default props", () => {
      render(<DesignSystemShowcaseContent />);
      expect(screen.getByText("<Button>Click me</Button>")).toBeInTheDocument();
    });

    it("regenerates the snippet when a control changes", async () => {
      const user = userEvent.setup();
      render(<DesignSystemShowcaseContent />);

      await user.selectOptions(
        screen.getByRole("combobox", { name: "Variant" }),
        "danger",
      );
      expect(
        screen.getByText('<Button variant="danger">Click me</Button>'),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("checkbox", { name: "Loading" }));
      expect(
        screen.getByText('<Button variant="danger" loading>Click me</Button>'),
      ).toBeInTheDocument();
    });
  });

  describe("Modal demo", () => {
    it("opens and closes the live dialog from the keyboard", async () => {
      const user = userEvent.setup();
      render(<DesignSystemShowcaseContent />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /open the dialog/i }),
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Motion primitives section", () => {
    it("gives the app-local primitives their own section", () => {
      render(<DesignSystemShowcaseContent />);
      expect(
        screen.getByRole("heading", { level: 2, name: /motion primitives/i }),
      ).toBeInTheDocument();
    });

    it("names every motion primitive", () => {
      render(<DesignSystemShowcaseContent />);
      for (const primitive of MOTION_PRIMITIVES) {
        expect(
          screen.getByRole("heading", { level: 3, name: primitive.name }),
        ).toBeInTheDocument();
      }
    });

    it("says which page each primitive ships on", () => {
      render(<DesignSystemShowcaseContent />);
      expect(screen.getAllByText(/ships on/i).length).toBeGreaterThanOrEqual(
        MOTION_PRIMITIVES.length,
      );
    });
  });

  describe("Component of the day", () => {
    const day = new Date("2026-09-12T12:00:00Z");

    it("features the deterministic daily pick with a jump link to its card", () => {
      render(<DesignSystemShowcaseContent today={day} />);
      const pick = spotlightFor(day);
      const section = screen
        .getByRole("heading", { name: /component of the day/i })
        .closest("section");
      expect(section).not.toBeNull();
      expect(within(section as HTMLElement).getByText(pick.name)).toBeInTheDocument();
      expect(
        within(section as HTMLElement).getByRole("link", { name: /jump to/i }),
      ).toHaveAttribute("href", `#${pick.id}`);
    });
  });

  describe("Component explorer", () => {
    const grid = () => document.getElementById("components") as HTMLElement;

    beforeEach(() => window.history.replaceState(null, "", "/design-system"));

    it("narrows the grid live as the visitor searches", async () => {
      const user = userEvent.setup();
      render(<DesignSystemShowcaseContent />);

      await user.type(
        screen.getByRole("searchbox", { name: /search components/i }),
        "gauge",
      );
      expect(
        within(grid()).getByRole("heading", { level: 3, name: "GaugeChart" }),
      ).toBeInTheDocument();
      expect(
        within(grid()).queryByRole("heading", { level: 3, name: "Avatar" }),
      ).not.toBeInTheDocument();
      expect(within(grid()).getByText(/1 of 45/)).toBeInTheDocument();
    });

    it("filters by category chip and marks it pressed", async () => {
      const user = userEvent.setup();
      render(<DesignSystemShowcaseContent />);

      const chip = screen.getByRole("button", { name: /charts & data/i });
      await user.click(chip);
      expect(chip).toHaveAttribute("aria-pressed", "true");
      expect(
        within(grid()).getByRole("heading", { level: 3, name: "BarChart" }),
      ).toBeInTheDocument();
      expect(
        within(grid()).queryByRole("heading", { level: 3, name: "Avatar" }),
      ).not.toBeInTheDocument();
      expect(within(grid()).getByText(/12 of 45/)).toBeInTheDocument();
    });

    it("offers to clear filters instead of a blank grid when nothing matches", async () => {
      const user = userEvent.setup();
      render(<DesignSystemShowcaseContent />);

      await user.type(
        screen.getByRole("searchbox", { name: /search components/i }),
        "zzzzzz",
      );
      expect(
        within(grid()).getByText(/no components match/i),
      ).toBeInTheDocument();

      await user.click(
        within(grid()).getByRole("button", { name: /clear filters/i }),
      );
      expect(
        within(grid()).getByRole("heading", { level: 3, name: "Avatar" }),
      ).toBeInTheDocument();
      expect(within(grid()).getByText(/45 of 45/)).toBeInTheDocument();
    });

    it("sorts the grid alphabetically on request", async () => {
      const user = userEvent.setup();
      render(<DesignSystemShowcaseContent />);

      await user.selectOptions(
        screen.getByRole("combobox", { name: /sort/i }),
        "name",
      );
      const headings = within(grid()).getAllByRole("heading", { level: 3 });
      expect(headings[0]).toHaveTextContent("Avatar");
    });

    it("lands the active filters in the URL so the view is shareable", async () => {
      const user = userEvent.setup();
      render(<DesignSystemShowcaseContent />);

      await user.type(
        screen.getByRole("searchbox", { name: /search components/i }),
        "chart",
      );
      await user.click(screen.getByRole("button", { name: /charts & data/i }));
      expect(window.location.search).toContain("q=chart");
      expect(window.location.search).toContain("category=charts");
    });

    it("gives every card an anchor a shared link can land on", () => {
      render(<DesignSystemShowcaseContent />);
      expect(document.getElementById("gauge-chart")).not.toBeNull();
      expect(document.getElementById("visually-hidden")).not.toBeNull();
    });
  });

  it("has no axe violations", async () => {
    const { container } = render(<DesignSystemShowcaseContent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);
});

describe("DesignSystemShowcaseContent guided tour", () => {
  beforeEach(() => window.localStorage.clear());

  it("exposes a Take the tour button and the anchors it points at", () => {
    window.localStorage.setItem("design-system-tour-seen", "true");
    render(<DesignSystemShowcaseContent />);
    expect(
      screen.getByRole("button", { name: /take the tour/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("ds-hero")).not.toBeNull();
    expect(document.getElementById("ds-playground")).not.toBeNull();
    expect(document.getElementById("components")).not.toBeNull();
    expect(document.getElementById("ds-tokens")).not.toBeNull();
  });

  it("opens the tour and walks into it", () => {
    window.localStorage.setItem("design-system-tour-seen", "true");
    render(<DesignSystemShowcaseContent />);
    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));
    const tour = () => screen.getByRole("dialog", { name: /tour/i });
    fireEvent.click(
      within(tour()).getByRole("button", { name: /^next$/i }),
    );
    expect(
      within(tour()).getByText(/the design system, live/i),
    ).toBeInTheDocument();
  });
});
