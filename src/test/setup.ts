import "@testing-library/jest-dom";
import "vitest-axe/extend-expect";
import * as axeMatchers from "vitest-axe/matchers";
import { server } from "./server";
import { beforeAll, afterEach, afterAll, expect } from "vitest";

expect.extend(axeMatchers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
