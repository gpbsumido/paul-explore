import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FlagCard from "@/components/flags/FlagCard";
import { buildFlag, buildEnvironmentConfig, buildRule } from "@/test/factories/flags";
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
    expect(verdict).toHaveTextContent("user-42");
    expect(verdict).toHaveTextContent(/on/i);
    expect(verdict).toHaveTextContent("Enterprise accounts get it first");
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
    // The "why" (and the sign-in link) lives in the section banner now, not on
    // every locked card.
    expect(screen.queryByText(/sign in to change/i)).not.toBeInTheDocument();
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
});
