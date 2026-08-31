import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RouteError from "./RouteError";

/**
 * This is what every failed route in the app renders, so its own accessibility
 * matters more than most components': a page that broke is exactly when
 * someone is least able to guess where they are.
 *
 * The three violations these pin were found by the pre-release axe scan on
 * /tcg/pokemon/card/:id while TCGdex was unreachable — document-title
 * (serious), landmark-one-main, and region.
 */
beforeEach(() => {
  document.title = "";
});

describe("RouteError", () => {
  it("is a main landmark, so its content is not stranded outside one", () => {
    render(<RouteError reset={vi.fn()} />);
    // Without this the document has no main landmark and every word on the
    // page sits outside any region — two separate axe violations.
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("gives the document a title when the failed page never produced one", () => {
    render(<RouteError reset={vi.fn()} />);
    expect(document.title).toBe("Something went wrong");
  });

  it("leaves a title alone when one already rendered higher up", () => {
    document.title = "Calendar | Paul Sumido";
    render(<RouteError reset={vi.fn()} />);
    // Only the empty case needs filling; clobbering a good title would make
    // the tab less useful, not more.
    expect(document.title).toBe("Calendar | Paul Sumido");
  });

  it("still explains itself and offers a retry", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<RouteError reset={reset} />);

    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
