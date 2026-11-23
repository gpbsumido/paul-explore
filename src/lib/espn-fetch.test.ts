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

  // The body is JSON on purpose: a private league answers 401 with a readable
  // message, and that must not reach a caller as if it were league data.
  it("returns null when ESPN answers with an error, even one with a JSON body", async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json(
          { messages: ["You are not authorized to view this League."] },
          { status: 401 },
        ),
      ),
    );
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
