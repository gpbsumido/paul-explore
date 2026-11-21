import { describe, it, expect } from "vitest";
import * as icon from "./icon";
import * as appleIcon from "./apple-icon";
import * as openGraphImage from "./opengraph-image";

/**
 * These images take no input, so on the Node runtime Next renders them once
 * at build. The edge runtime is deprecated in Next 16 and forces a render on
 * every request, with a warning for each at startup.
 */
describe("metadata images", () => {
  it.each([
    ["icon", icon],
    ["apple-icon", appleIcon],
    ["opengraph-image", openGraphImage],
  ])("%s doesn't opt into the edge runtime", (_name, route) => {
    expect("runtime" in route ? route.runtime : undefined).not.toBe("edge");
  });
});
