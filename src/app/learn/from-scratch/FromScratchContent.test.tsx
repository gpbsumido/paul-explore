import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FromScratchContent from "./FromScratchContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const counter = () => screen.getByText(/^\d+\/\d+$/).textContent ?? "";

describe("FromScratchContent walkthrough", () => {
  it("builds the function one line at a time, and only offers the tests at the end", async () => {
    const user = userEvent.setup();
    render(<FromScratchContent />);
    expect(counter()).toMatch(/^0\/\d+$/);
    const total = Number(counter().split("/")[1]);
    expect(screen.queryByRole("button", { name: "Run tests" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next line" }));
    expect(counter()).toBe(`1/${total}`);
    expect(screen.getByText(/function once\(fn\)/)).toBeInTheDocument();
    expect(screen.queryByText(/let called = false/)).not.toBeInTheDocument();

    for (let i = 1; i < total; i += 1) {
      await user.click(screen.getByRole("button", { name: "Next line" }));
    }
    expect(counter()).toBe(`${total}/${total}`);
    expect(screen.getByRole("button", { name: "Complete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run tests" })).toBeInTheDocument();

    // Pressing past the end does not overrun the count.
    await user.click(screen.getByRole("button", { name: "Complete" }));
    expect(counter()).toBe(`${total}/${total}`);
  });

  it("marks every test passed after Run tests, and Reset puts the walkthrough back", async () => {
    const user = userEvent.setup();
    render(<FromScratchContent />);
    while (!screen.queryByRole("button", { name: "Run tests" })) {
      await user.click(screen.getByRole("button", { name: /Next line/ }));
    }

    await user.click(screen.getByRole("button", { name: "Run tests" }));
    expect(screen.getByText("calls the function on first invocation")).toBeInTheDocument();
    expect(screen.getAllByText("✓")).toHaveLength(3);
    expect(screen.queryByText("✗")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(counter()).toMatch(/^0\//);
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
    expect(screen.queryByText("calls the function on first invocation")).not.toBeInTheDocument();
  });

  it("starts the next function from a clean slate when its tab is picked", async () => {
    const user = userEvent.setup();
    render(<FromScratchContent />);
    await user.click(screen.getByRole("button", { name: "Next line" }));
    expect(counter()).toMatch(/^1\//);

    await user.click(screen.getByRole("button", { name: "bind()" }));

    expect(await screen.findByText(/Implement Function.prototype.bind/)).toBeInTheDocument();
    expect(counter()).toMatch(/^0\//);
    expect(screen.queryByText(/function once\(fn\)/)).not.toBeInTheDocument();
  });
});
