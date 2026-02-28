// Streams with the HTML shell before the server fetch resolves.
// Delegates to MonthSkeleton so the placeholder and the real grid share
// the same structure -- easier to keep in sync when the layout changes.
import { MonthSkeleton } from "./CalendarSkeletons";

export default function CalendarLoading() {
  return <MonthSkeleton />;
}
