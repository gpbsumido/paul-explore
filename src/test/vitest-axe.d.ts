import "vitest";
import type { NoViolationsMatcherResult } from "vitest-axe";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Assertion<T = unknown> {
    toHaveNoViolations(): NoViolationsMatcherResult;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): NoViolationsMatcherResult;
  }
}
