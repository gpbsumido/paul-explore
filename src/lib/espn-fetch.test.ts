import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchEspnJson } from "./espn-fetch";

const URL = "https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

/** ESPN reads degrade to "no data" rather than failing the page that asked. */
describe("fetchEspnJson", () => {
  it("returns the parsed body", async () => {
    server.use(http.get(URL, () => HttpResponse.json({ events: [] })));
    expect(await fetchEspnJson(URL)).toEqual({ events: [] });
  });

  it("returns null when ESPN answers with an error", async () => {
    server.use(http.get(URL, () => new HttpResponse(null, { status: 503 })));
    expect(await fetchEspnJson(URL)).toBeNull();
  });

  it("returns null when the body isn't JSON", async () => {
    server.use(http.get(URL, () => new HttpResponse("<html>", { status: 200 })));
    expect(await fetchEspnJson(URL)).toBeNull();
  });

  it("passes the league cookie along when it's given one", async () => {
    let cookie: string | null = null;
    server.use(
      http.get(URL, ({ request }) => {
        cookie = request.headers.get("cookie");
        return HttpResponse.json({});
      }),
    );
    await fetchEspnJson(URL, { cookie: "espn_s2=a; SWID=b" });
    expect(cookie).toBe("espn_s2=a; SWID=b");
  });
});
