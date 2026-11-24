import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { FEATURES } from "@/app/_shared/featureData";
import FeatureHub from "./FeatureHub";

// The header pulls in the session menu and its own providers; the part under
// test is the name block it is handed, so render just left and right.
vi.mock("@/components/PageHeader", () => ({
  default: ({
    left,
    right,
  }: {
    left?: React.ReactNode;
    right?: React.ReactNode;
  }) => (
    <header>
      {left}
      {right}
    </header>
  ),
}));

const renderHub = (initialMe?: { name: string | null; email: string | null }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <FeatureHub initialMe={initialMe} />
    </QueryClientProvider>,
  );
};

/** Holds /api/me open so the first paint is all the server-seeded name has to go on. */
const meNeverAnswers = () =>
  server.use(http.get("/api/me", () => new Promise<Response>(() => {})));

const meIs = (me: { name: string | null; email: string | null }) =>
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json({ ...me, sub: "auth0|me", isFlagAdmin: false }),
    ),
  );

describe("FeatureHub greeting", () => {
  it("greets the signed-in visitor by first name, from the server-read name on first paint", () => {
    meNeverAnswers();
    renderHub({ name: "Paul Sumido", email: "paul@example.com" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Hey Paul, here's what's live." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paul Sumido")).toBeInTheDocument();
    expect(screen.getByText("paul@example.com")).toBeInTheDocument();
  });

  it("greets a nameless visitor as 'there', and says so when there is no email", () => {
    meNeverAnswers();
    renderHub({ name: null, email: null });

    expect(
      screen.getByRole("heading", { level: 1, name: "Hey there, here's what's live." }),
    ).toBeInTheDocument();
    expect(screen.getByText("there")).toBeInTheDocument();
    expect(screen.getByText("no email on file")).toBeInTheDocument();
  });

  it("shows placeholders, not a name, until it knows who is signed in", () => {
    meNeverAnswers();
    renderHub();

    expect(
      screen.getByRole("heading", { level: 1, name: "Hey there, here's what's live." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("no email on file")).toBeNull();
    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(2);
  });

  it("switches to what /api/me says once it answers, over the server-read name", async () => {
    meIs({ name: "Sam Rivera", email: "sam@example.com" });
    renderHub({ name: "Paul Sumido", email: "paul@example.com" });

    expect(await screen.findByText("Sam Rivera")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Paul Sumido")).toBeNull();
    expect(
      screen.getByRole("heading", { level: 1, name: "Hey Sam, here's what's live." }),
    ).toBeInTheDocument();
  });

  it("counts the features it shows rather than typing a number", () => {
    meNeverAnswers();
    renderHub();

    expect(
      screen.getByText(new RegExp(`^${FEATURES.length} features`)),
    ).toBeInTheDocument();
  });
});
