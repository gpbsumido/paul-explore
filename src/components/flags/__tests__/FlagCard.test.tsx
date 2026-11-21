import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FlagCard from "@/components/flags/FlagCard";
import {
  buildFlag,
  buildEnvironmentConfig,
  buildRule,
} from "@/test/factories/flags";
import type { EvaluationResult } from "@/types/flags";

const noop = () => {};

const targetedFlag = buildFlag({
  environments: {
    development: buildEnvironmentConfig({
      rules: [buildRule({ description: "Enterprise accounts get it first" })],
    }),
    staging: buildEnvironmentConfig(),
    production: buildEnvironmentConfig(),
  },
});

describe("FlagCard verdict strip", () => {
  it("stays hidden until a test user is evaluated", () => {
    render(
      <FlagCard
        flag={buildFlag()}
        environment="development"
        pending={false}
        onToggle={noop}
        onRollout={noop}
      />,
    );

    expect(screen.queryByTestId("flag-verdict")).not.toBeInTheDocument();
  });

  it("shows what the tested user gets and why", () => {
    const result: EvaluationResult = {
      flagKey: "new-checkout",
      variationKey: "on",
      value: true,
      reason: "RULE_MATCH",
      ruleIndex: 0,
    };

    render(
      <FlagCard
        flag={targetedFlag}
        environment="development"
        pending={false}
        onToggle={noop}
        onRollout={noop}
        contextKey="user-42"
        result={result}
      />,
    );

    const verdict = screen.getByTestId("flag-verdict");
    expect(verdict).toHaveTextContent("user-42 gets ON");
    expect(verdict).toHaveTextContent("Enterprise accounts get it first");
  });
});

describe("FlagCard verdict wording", () => {
  const verdictFor = (overrides: Partial<EvaluationResult>, contextKey?: string) => {
    render(
      <FlagCard
        flag={buildFlag()}
        environment="development"
        pending={false}
        onToggle={noop}
        onRollout={noop}
        contextKey={contextKey}
        result={{
          flagKey: "new-checkout",
          variationKey: "off",
          value: false,
          reason: "OFF",
          ...overrides,
        }}
      />,
    );
    return screen.getByTestId("flag-verdict");
  };

  it("says OFF, and why, when the flag is switched off for that user", () => {
    const verdict = verdictFor({}, "user-7");
    expect(verdict).toHaveTextContent("user-7 gets OFF");
    expect(verdict).toHaveTextContent(/switched off here/i);
  });

  it("names a non-boolean result by its variation, not ON/OFF", () => {
    const verdict = verdictFor({ variationKey: "on", value: "blue" }, "user-7");
    expect(verdict).toHaveTextContent("user-7 gets Enabled");
  });

  it("calls the tested user 'this user' when no key was typed", () => {
    expect(verdictFor({}, "   ")).toHaveTextContent("this user gets OFF");
  });
});

describe("FlagCard signed-out state", () => {
  it("locks the kill switch and rollout when editing is not allowed", () => {
    render(
      <FlagCard
        flag={buildFlag()}
        environment="production"
        pending={false}
        onToggle={noop}
        onRollout={noop}
        canEdit={false}
      />,
    );

    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("slider")).toBeDisabled();
    // With no reason given there is nothing extra to say on the card.
    expect(screen.queryByText(/sign in to change/i)).not.toBeInTheDocument();
  });

  it("says why the controls are locked, on the card, when it is given a reason", () => {
    render(
      <FlagCard
        flag={buildFlag()}
        environment="production"
        pending={false}
        onToggle={noop}
        onRollout={noop}
        canEdit={false}
        lockedReason="Sign in to change flags."
      />,
    );

    expect(screen.getByText("Sign in to change flags.")).toBeInTheDocument();
  });

  it("does not show the locked reason to someone who can edit", () => {
    render(
      <FlagCard
        flag={buildFlag()}
        environment="production"
        pending={false}
        onToggle={noop}
        onRollout={noop}
        canEdit
        lockedReason="Sign in to change flags."
      />,
    );

    expect(screen.queryByText("Sign in to change flags.")).not.toBeInTheDocument();
  });

  it("leaves the controls interactive when editing is allowed", () => {
    render(
      <FlagCard
        flag={buildFlag()}
        environment="production"
        pending={false}
        onToggle={noop}
        onRollout={noop}
        canEdit
      />,
    );

    expect(screen.getByRole("switch")).not.toBeDisabled();
    expect(screen.getByRole("slider")).not.toBeDisabled();
    expect(screen.queryByText(/sign in to change/i)).not.toBeInTheDocument();
  });
});

describe("FlagCard controls", () => {
  it("toggles the flag when the switch is pressed", () => {
    const onToggle = vi.fn();
    render(
      <FlagCard
        flag={buildFlag({
          environments: {
            development: buildEnvironmentConfig({ enabled: false }),
            staging: buildEnvironmentConfig(),
            production: buildEnvironmentConfig(),
          },
        })}
        environment="development"
        pending={false}
        onToggle={onToggle}
        onRollout={noop}
      />,
    );

    screen.getByRole("switch").click();
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("turns the flag off when it is currently on", () => {
    const onToggle = vi.fn();
    render(
      <FlagCard
        flag={buildFlag()}
        environment="development"
        pending={false}
        onToggle={onToggle}
        onRollout={noop}
      />,
    );

    screen.getByRole("switch").click();
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("locks the controls while a save is in flight", () => {
    render(
      <FlagCard
        flag={buildFlag()}
        environment="development"
        pending
        onToggle={noop}
        onRollout={noop}
      />,
    );

    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("slider")).toBeDisabled();
  });

  it("locks the rollout slider, but not the switch, while the flag is off", () => {
    render(
      <FlagCard
        flag={buildFlag({
          environments: {
            development: buildEnvironmentConfig({ enabled: false }),
            staging: buildEnvironmentConfig(),
            production: buildEnvironmentConfig(),
          },
        })}
        environment="development"
        pending={false}
        onToggle={noop}
        onRollout={noop}
      />,
    );

    expect(screen.getByRole("slider")).toBeDisabled();
    expect(screen.getByRole("switch")).not.toBeDisabled();
  });

  it("sends the on/off split once the slider is released, not while it is dragged", () => {
    const onRollout = vi.fn();
    render(
      <FlagCard
        flag={buildFlag()}
        environment="development"
        pending={false}
        onToggle={noop}
        onRollout={onRollout}
      />,
    );
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "40" } });
    expect(onRollout).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-valuetext", "40 percent");

    fireEvent.keyUp(slider);
    expect(onRollout).toHaveBeenCalledExactlyOnceWith([
      { variation: "on", weight: 40 },
      { variation: "off", weight: 60 },
    ]);
  });

  it("does not send a rollout when the slider is dragged away and released back where it started", () => {
    const onRollout = vi.fn();
    render(
      <FlagCard
        flag={buildFlag()}
        environment="development"
        pending={false}
        onToggle={noop}
        onRollout={onRollout}
      />,
    );

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "30" } });
    fireEvent.change(slider, { target: { value: "0" } });
    fireEvent.keyUp(slider);
    expect(onRollout).not.toHaveBeenCalled();
  });

  it("shows a multivariate flag's traffic split instead of a slider", () => {
    render(
      <FlagCard
        flag={buildFlag({
          kind: "multivariate",
          variations: [
            { key: "a", name: "Variant A", value: "a" },
            { key: "b", name: "Variant B", value: "b" },
          ],
          environments: {
            development: buildEnvironmentConfig({
              fallthrough: [
                { variation: "a", weight: 70 },
                { variation: "b", weight: 30 },
              ],
            }),
            staging: buildEnvironmentConfig(),
            production: buildEnvironmentConfig(),
          },
        })}
        environment="development"
        pending={false}
        onToggle={noop}
        onRollout={noop}
      />,
    );

    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.getByText("Variant A")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("Variant B")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("lists each targeting rule with the variation it serves", () => {
    render(
      <FlagCard
        flag={targetedFlag}
        environment="development"
        pending={false}
        onToggle={noop}
        onRollout={noop}
      />,
    );

    const item = screen.getByText(/Enterprise accounts get it first/).closest("li");
    expect(item).toHaveTextContent("serves Enabled");
  });
});
