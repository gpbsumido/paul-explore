import { createRef } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import InfiniteCalendarScroll, {
  type InfiniteCalendarScrollHandle,
} from "../InfiniteCalendarScroll";

/**
 * jsdom has no IntersectionObserver or layout, so each sentinel gets a stand-in
 * the test can fire by hand. The observed element tells top from bottom.
 */
const observers = vi.hoisted(
  () => [] as { element: Element; callback: (entries: { isIntersecting: boolean }[]) => void }[],
);

class FakeIntersectionObserver {
  private callback: (entries: { isIntersecting: boolean }[]) => void;
  constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
    this.callback = callback;
  }
  observe(element: Element) {
    observers.push({ element, callback: this.callback });
  }
  disconnect() {
    for (let i = observers.length - 1; i >= 0; i -= 1) {
      if (observers[i].callback === this.callback) observers.splice(i, 1);
    }
  }
  unobserve() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});
afterEach(() => vi.unstubAllGlobals());

const getNextPeriod = (date: Date) => startOfMonth(addMonths(date, 1));
const getPrevPeriod = (date: Date) => startOfMonth(subMonths(date, 1));
const getPeriodKey = (date: Date) => format(date, "yyyy-MM-dd");
const MARCH = new Date(2026, 2, 1);

function setup(next: (date: Date) => Date = getNextPeriod) {
  const onVisibleDateChange = vi.fn();
  const onPeriodsChange = vi.fn();
  const ref = createRef<InfiniteCalendarScrollHandle>();
  render(
    <InfiniteCalendarScroll
      ref={ref}
      initialDate={MARCH}
      getNextPeriod={next}
      getPrevPeriod={getPrevPeriod}
      getPeriodKey={getPeriodKey}
      renderPeriod={(date) => <p>{format(date, "MMMM yyyy")}</p>}
      onVisibleDateChange={onVisibleDateChange}
      onPeriodsChange={onPeriodsChange}
      containerHeight="400px"
    />,
  );
  const region = screen.getByRole("region", { name: "Calendar scroll area" });
  const sentinel = (which: "top" | "bottom") =>
    which === "top" ? region.firstElementChild! : region.lastElementChild!;
  const fire = (which: "top" | "bottom", isIntersecting = true) =>
    act(() => {
      observers
        .filter((o) => o.element === sentinel(which))
        .forEach((o) => o.callback([{ isIntersecting }]));
    });
  const shown = () =>
    [...region.querySelectorAll("[data-period-key]")].map((el) => el.textContent);
  return { region, fire, shown, onVisibleDateChange, onPeriodsChange, ref };
}

describe("InfiniteCalendarScroll", () => {
  it("starts with the month before, the month itself and the month after", () => {
    const { shown, region } = setup();
    expect(shown()).toEqual(["February 2026", "March 2026", "April 2026"]);
    expect(region).toHaveStyle({ height: "400px" });
  });

  it("tells the parent which periods it is showing, and again as they change", () => {
    const { onPeriodsChange, fire } = setup();
    expect(onPeriodsChange.mock.calls.at(-1)?.[0].map(getPeriodKey)).toEqual([
      "2026-02-01",
      "2026-03-01",
      "2026-04-01",
    ]);

    fire("bottom");
    expect(onPeriodsChange.mock.calls.at(-1)?.[0].map(getPeriodKey)).toEqual([
      "2026-02-01",
      "2026-03-01",
      "2026-04-01",
      "2026-05-01",
    ]);
  });

  it("adds the next month when the bottom sentinel comes into view", () => {
    const { fire, shown } = setup();
    fire("bottom");
    expect(shown()).toEqual(["February 2026", "March 2026", "April 2026", "May 2026"]);
    fire("bottom");
    expect(shown().at(-1)).toBe("June 2026");
  });

  it("does not add a period it already has when there is nothing further on", () => {
    const stopsAtApril = (date: Date) =>
      date >= new Date(2026, 3, 1) ? date : getNextPeriod(date);
    const { fire, shown } = setup(stopsAtApril);
    fire("bottom");
    fire("bottom");
    expect(shown()).toEqual(["February 2026", "March 2026", "April 2026"]);
  });

  it("adds the previous month above when the top sentinel comes into view", () => {
    const { fire, shown } = setup();
    fire("top");
    expect(shown()).toEqual(["January 2026", "February 2026", "March 2026", "April 2026"]);
  });

  it("does nothing while a sentinel is leaving view rather than entering it", () => {
    const { fire, shown } = setup();
    fire("bottom", false);
    fire("top", false);
    expect(shown()).toHaveLength(3);
  });

  it("reports the period at the top of the view as the reader scrolls", () => {
    const { region, onVisibleDateChange } = setup();
    // jsdom lays nothing out, so every period reports a top of 0 and the last
    // one at or above the edge wins, which is the same rule it uses for real.
    fireEvent.scroll(region);
    const reported = onVisibleDateChange.mock.calls.at(-1)?.[0] as Date;
    expect(getPeriodKey(reported)).toBe("2026-04-01");
  });

  it("scrolls to a date by resetting to the three months around it and reporting it", () => {
    const { ref, shown, fire, onVisibleDateChange } = setup();
    fire("bottom");
    fire("bottom");
    expect(shown()).toHaveLength(5);

    act(() => ref.current?.scrollToDate(new Date(2027, 0, 1)));

    expect(shown()).toEqual(["December 2026", "January 2027", "February 2027"]);
    expect(getPeriodKey(onVisibleDateChange.mock.calls.at(-1)?.[0] as Date)).toBe("2027-01-01");
  });

  it("ignores a scroll event that would drag it off a date it was just sent to", () => {
    const { ref, region, onVisibleDateChange } = setup();
    act(() => ref.current?.scrollToDate(new Date(2027, 0, 1)));
    onVisibleDateChange.mockClear();

    // With no layout the last period wins a scroll, which is not the target.
    fireEvent.scroll(region);

    expect(onVisibleDateChange).not.toHaveBeenCalled();
  });

  it("also takes the 'today' variant of the jump", () => {
    const { ref, shown } = setup();
    act(() => ref.current?.scrollToToday(new Date(2026, 5, 1)));
    expect(shown()).toEqual(["May 2026", "June 2026", "July 2026"]);
  });
});
