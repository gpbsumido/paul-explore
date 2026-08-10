import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import DesignSystemShowcaseContent from "./DesignSystemShowcaseContent";
import { COMPONENTS } from "./catalog";

// PageHeader pulls in HeaderMenu which fetches /api/me; the showcase itself is
// what we're testing, so stub the shared header the way the thoughts index test
// does.
vi.mock("@/components/PageHeader", () => ({ default: () => null }));

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

  it("has no axe violations", async () => {
    const { container } = render(<DesignSystemShowcaseContent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);
});
