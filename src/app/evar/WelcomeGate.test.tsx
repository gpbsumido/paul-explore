import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WelcomeGate from "./WelcomeGate";
import EvarEntry from "./EvarEntry";
import { WELCOME_GATE_SCRIPT } from "@/lib/evar/welcomeGate";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => {
  replace.mockClear();
  window.localStorage.clear();
});

describe("WelcomeGate", () => {
  it("sends a first visit on to the welcome page without drawing the practice", () => {
    render(
      <WelcomeGate>
        <p>the practice</p>
      </WelcomeGate>,
    );
    expect(screen.queryByText("the practice")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/evar/welcome");
  });

  it("shows the practice to someone who has been welcomed", () => {
    window.localStorage.setItem("evar-welcomed", "true");
    render(
      <WelcomeGate>
        <p>the practice</p>
      </WelcomeGate>,
    );
    expect(screen.getByText("the practice")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("EvarEntry", () => {
  it("ships the gate script ahead of the practice, for full page loads", () => {
    window.localStorage.setItem("evar-welcomed", "true");
    const { container } = render(
      <EvarEntry>
        <p>the practice</p>
      </EvarEntry>,
    );
    expect(container.querySelector("script")?.innerHTML).toBe(WELCOME_GATE_SCRIPT);
    expect(screen.getByText("the practice")).toBeInTheDocument();
  });
});
