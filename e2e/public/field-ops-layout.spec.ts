import { test, expect } from "@playwright/test";

/**
 * The console has to fit the window however many alerts pile up. A long queue
 * used to stretch the page, so the newest alerts sat below the fold and the map
 * scrolled away while you read them. jsdom has no layout, so this lives here.
 *
 * The socket is faked in the page so the test doesn't depend on portfolio_api
 * being up: six tracks and 30 alerts, of which the console keeps the newest 20, every second.
 */

const ALERT_COUNT = 30;

function aFrame(sequence: number) {
  const now = Date.now();
  const kinds = ["vehicle", "aircraft", "vessel"] as const;
  const severities = ["critical", "warning", "info"] as const;
  return JSON.stringify({
    sequence,
    snapshot: {
      serverTimeMs: now,
      tracks: Array.from({ length: 6 }, (_, index) => ({
        id: `t${index}`,
        callsign: `Alpha ${index + 1}`,
        kind: kinds[index % 3],
        eastMeters: index * 120 - 300,
        northMeters: index * 80 - 200,
        altitudeMeters: 0,
        headingDegrees: 90,
        speedMetersPerSecond: 5,
        lastReportedAtMs: now,
      })),
      alerts: Array.from({ length: ALERT_COUNT }, (_, index) => ({
        id: `a${index}`,
        trackId: `t${index % 6}`,
        severity: severities[index % 3],
        message: `Alert ${index + 1}`,
        raisedAtMs: now - index * 1000,
      })),
    },
  });
}

test.use({ viewport: { width: 1440, height: 900 } });

test("a long alert queue scrolls in its column instead of stretching the page", async ({
  page,
}) => {
  await page.routeWebSocket(/\/api\/field-ops\/socket/, (socket) => {
    socket.send(aFrame(1));
  });
  await page.goto("/lab/field-ops");
  await expect(page.getByText("Critical: Alert 1", { exact: true })).toBeVisible();

  const alertQueue = page.getByRole("region", { name: "Alerts" });
  const queueOverflows = await alertQueue.evaluate(
    (element) => element.scrollHeight > element.clientHeight,
  );
  expect(queueOverflows).toBe(true);

  const pageOverflowPx = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  expect(pageOverflowPx).toBeLessThanOrEqual(0);
});
