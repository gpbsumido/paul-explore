import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "@/test/a11y";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

import GreenChecksContent from "./GreenChecksContent";

describe("the green checks write-up", () => {
  it("reports no axe violations in the summary view", async () => {
    const { container } = render(<GreenChecksContent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("records the suite that was published against but never run", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/864\s+tests\s+across\s+four\s+workspaces/);
    expect(body).toMatch(/nothing\s+in\s+CI\s+ever\s+ran\s+them/);
  });

  it("proves the new workflow against a real regression before trusting it", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /A\s+workflow\s+that\s+has\s+never\s+failed\s+has\s+not\s+been\s+shown\s+to\s+work/,
    );
  });

  it("says the visual check was green on a flag rather than a comparison", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/green\s+on\s+a\s+flag,\s+not\s+on\s+a\s+comparison/);
  });

  it("records that the visual gate was positioned to ratify drift, not just miss it", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /adopt\s+it\s+as\s+the\s+new\s+baseline\s+on\s+the\s+next\s+release\s+merge/,
    );
  });

  it("corrects the gel button figure rather than restating it", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/measured\s+under\s+the\s+gloss\s+rather\s+than\s+through\s+it/);
    expect(body).toMatch(/1\.69:1\s+at\s+rest/);
  });

  it("explains why darkening the ramp could never have reached AA on its own", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/caps\s+whatever\s+is\s+underneath\s+it\s+at\s+3\.35:1/);
  });

  it("puts a guard on the new sampler itself", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /composited\s+floor\s+has\s+to\s+stay\s+strictly\s+below\s+the\s+bare-stop\s+reading/,
    );
    expect(body).toMatch(/ratios\s+would\s+improve\s+while\s+the\s+button\s+got\s+worse/);
  });

  it("names the test count that depended on whether you had built", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/42\s+became\s+84/);
    expect(body).toMatch(/\*\*\/dist\/\*\*/);
    expect(body).toMatch(/\*\*\/build\/\*\*/);
  });

  it("records that the published tarball was shipping its own tests", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/thirty-one\s+entries\s+to\s+twenty-one/);
  });

  it("states the root the four findings share", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /measuring\s+something\s+other\s+than\s+the\s+thing\s+it\s+named/,
    );
  });

  it("is honest that no test failing is what found any of them", () => {
    render(<GreenChecksContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /Not\s+one\s+of\s+these\s+was\s+caught\s+by\s+a\s+test\s+failing/,
    );
  });
});
