import { test, expect } from "@playwright/test";
import { checkA11y } from "../helpers/axe";
import { disableTours } from "../helpers/tours";
import { waitForPageToSettle } from "../helpers/settle";

/**
 * The playoffs scan flaked in CI on its first, cold hit: the bracket loads
 * after the page does, swapping a pulsing skeleton for columns that fade in.
 * For a frame between the two nothing is animating, and the bracket is still
 * fully transparent, so a scan that only asks "is anything animating?" can
 * measure every label at zero opacity. Holding the bracket back a second
 * reproduces that every time instead of whenever the API happens to be slow.
 */
const team = (
  seed: number,
  teamId: string,
  abbreviation: string,
  name: string,
  conference: "East" | "West",
) => ({ seed, teamId, abbreviation, name, conference });

const BRACKET = {
  season: 2026,
  matchups: [
    {
      id: "E_R1_M1",
      round: 1,
      conference: "East",
      topTeam: team(1, "8", "DET", "Detroit Pistons", "East"),
      bottomTeam: team(8, "19", "ORL", "Orlando Magic", "East"),
    },
    {
      id: "W_R1_M1",
      round: 1,
      conference: "West",
      topTeam: team(1, "25", "OKC", "Oklahoma City Thunder", "West"),
      bottomTeam: team(8, "21", "PHX", "Phoenix Suns", "West"),
    },
    {
      id: "NBA_FINALS",
      round: 4,
      conference: "Finals",
      topTeam: team(0, "", "TBD", "TBD", "East"),
      bottomTeam: team(0, "", "TBD", "TBD", "West"),
    },
  ],
};

for (const theme of ["dark", "light"] as const) {
  test.describe(`Scanning content that loads late @a11y (${theme})`, () => {
    test("waits for the playoffs bracket to finish fading in", async ({
      page,
    }) => {
      await page.addInitScript((preference) => {
        window.localStorage.setItem("theme-preference", preference);
      }, theme);
      await disableTours(page);
      await page.route("**/api/nba/playoffs/bracket", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(BRACKET),
        });
      });

      await page.goto("/fantasy/nba/playoffs");
      await waitForPageToSettle(page);

      // The bracket, not its skeleton, is what this scan has to measure.
      await expect(
        page.getByRole("heading", { name: "Eastern Conference" }),
      ).toBeVisible();
      await checkA11y(page, `/fantasy/nba/playoffs, bracket late (${theme})`);
    });
  });
}
