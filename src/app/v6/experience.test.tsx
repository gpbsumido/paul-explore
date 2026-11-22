import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import { EDUCATION, WORK } from "./experience";
import ExperienceCard from "./ExperienceCard";

/**
 * The timeline card from the reference site, filled from my published résumé
 * (public/resume). Work and Education share one card and a switch.
 */
describe("the experience card", () => {
  it("opens on work, newest role first", () => {
    render(<ExperienceCard />);
    const work = screen.getByRole("list", { name: "Work history" });
    // Each role carries its own list of highlights, so count the top level only.
    const roles = Array.from(work.children, (item) => item.textContent ?? "");
    expect(roles).toHaveLength(WORK.length);
    expect(roles[0]).toContain("Helika");
    expect(roles.at(-1)).toContain("PeopleInsight");
  });

  it("dates every entry so the order is readable, not just visual", () => {
    const { container } = render(<ExperienceCard />);
    expect(container.querySelectorAll("time")).toHaveLength(WORK.length);
  });

  it("switches the same card to education", async () => {
    render(<ExperienceCard />);
    await userEvent.click(screen.getByRole("radio", { name: "Education" }));
    const education = screen.getByRole("list", { name: "Education" });
    expect(within(education).getAllByRole("listitem")).toHaveLength(EDUCATION.length);
    expect(education).toHaveTextContent("Carleton University");
    expect(screen.queryByRole("list", { name: "Work history" })).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ExperienceCard />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
