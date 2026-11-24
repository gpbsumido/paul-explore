import { vi } from "vitest";
import {
  PINNED_FACTORY_NOW,
  pinFactories,
  seededRandom,
} from "./factories/operator";

/**
 * Pins the operator factories, and the clock the app reads, before anything
 * builds a record. It is its own module so the setup file can import it ahead
 * of the MSW server: that import seeds the handlers' fleet the moment it loads,
 * and a seed built before the pin would be the unpinned one.
 *
 * The clock is pinned as well as the factories because the seed is dated
 * against it and the code under test windows it ("the last 7 days"). A seed
 * fixed at one instant read against the real clock is empty by the next day.
 */
pinFactories({ random: seededRandom(20260617), now: PINNED_FACTORY_NOW });
vi.setSystemTime(PINNED_FACTORY_NOW);
