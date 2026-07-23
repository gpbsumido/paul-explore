import type { ChangeEventHandler, CSSProperties, ReactNode } from "react";
import { selectChevron } from "@/assets/icons";

const SELECT_CLASS =
  "h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors hover:border-foreground/30 focus:border-foreground/50";

const SELECT_STYLE: CSSProperties = {
  backgroundImage: selectChevron,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: "28px",
};

type Props = {
  /** Visible text label and the select's accessible name. */
  label: string;
  value: string | number;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  /** Extra classes for the visible label span (e.g. margin tweaks). */
  labelClassName?: string;
  /** The <option> elements. */
  children: ReactNode;
};

/**
 * A labelled, accessible <select> with the shared filter styling and chevron.
 * Renders the label span and the select as siblings so it drops straight into a
 * flex filter row. Replaces the per-page selectClass/selectStyle boilerplate.
 */
export default function LabelledSelect({
  label,
  value,
  onChange,
  disabled,
  labelClassName,
  children,
}: Props) {
  return (
    <>
      <span
        className={`text-[13px] text-muted shrink-0${
          labelClassName ? ` ${labelClassName}` : ""
        }`}
      >
        {label}
      </span>
      <select
        aria-label={label}
        className={SELECT_CLASS}
        style={SELECT_STYLE}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {children}
      </select>
    </>
  );
}
