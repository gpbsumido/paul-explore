import Link from "next/link";
import { type ReactNode } from "react";
import HeaderMenu from "@/components/HeaderMenu";
import FeatureThoughtsLink from "@/components/FeatureThoughtsLink";
import FloatingHeaderFrame from "@/components/FloatingHeaderFrame";

export interface BreadcrumbItem {
  /** Display text. */
  label: string;
  /**
   * If provided, the item renders as a link.
   * The first item in the list always gets back-chevron styling.
   */
  href?: string;
  /** Renders the item as a pill badge instead of plain text (no href needed). */
  badge?: boolean;
  /** Optional click handler attached to the link — useful for flushing queries before navigating. */
  onClick?: () => void;
}

export interface PageHeaderProps {
  /**
   * Left-side breadcrumb trail.
   * First item should have an href (the back/up link).
   * Last item without an href is treated as the current-page label.
   */
  breadcrumbs?: BreadcrumbItem[];
  /**
   * Replaces the breadcrumb trail entirely when you need a fully custom left side.
   * Useful for the hub header that shows the app name instead of a back link.
   */
  left?: ReactNode;
  /**
   * Content rendered before the menu on the right.
   * Use this for secondary nav links, version selectors, view toggles, etc.
   */
  right?: ReactNode;
  /** Show the Settings link in the dropdown. Defaults to false. */
  showSettings?: boolean;
  /** Show the Log out link in the dropdown. Defaults to true. */
  showLogout?: boolean;
  /** Max-width class applied to the inner container. Defaults to "max-w-5xl". */
  maxWidth?: string;
  /** z-index class on the element. Defaults to "z-20". */
  zIndex?: string;
  /**
   * Absolutely-positioned overlay rendered inside the header — useful for
   * decorative gradients or other non-interactive embellishments.
   */
  overlay?: ReactNode;
  /** The HTML element to render. Defaults to "nav". */
  as?: "nav" | "header";
}

function BackChevron() {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
      <path
        d="M5 1L1 5l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The site's wordmark. Used as the home link wherever a breadcrumb trail starts
 * at `/`, so every page carries the same brand the landing does.
 */
export function Wordmark() {
  return (
    <span className="font-display text-[17px] font-bold tracking-[-0.02em] text-foreground whitespace-nowrap">
      paul<span className="text-primary-600 dark:text-primary-400">—</span>explore
    </span>
  );
}

/**
 * Shared sticky page header used across all feature and thoughts pages.
 *
 * Full width at the top of the page; once the page scrolls it lifts into a
 * centered floating pill (see FloatingHeaderFrame). The pill lives inside the
 * same 56px box, so sticky sub-bars pinned at top-14 never move.
 *
 * Renders a breadcrumb trail (or custom left content)
 * and optional extra content on the right, plus a dropdown menu that consolidates
 * theme switching, optional settings navigation, and optional logout.
 *
 * @example Feature page
 * ```tsx
 * <PageHeader breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Calendar" }]} />
 * ```
 *
 * @example Nested breadcrumb with a right-side link
 * ```tsx
 * <PageHeader
 *   breadcrumbs={[
 *     { label: "Dashboard", href: "/" },
 *     { label: "Browse", href: "/tcg/pokemon" },
 *     { label: "Sets" },
 *   ]}
 *   right={<Link href="/tcg/pocket" className="text-sm text-muted hover:text-foreground transition-colors">Pocket</Link>}
 * />
 * ```
 *
 * @example Thoughts page (narrow container, view toggle)
 * ```tsx
 * <PageHeader
 *   breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Calendar" }]}
 *   right={<ViewToggle view={view} setView={setView} />}
 *   maxWidth="max-w-3xl"
 * />
 * ```
 *
 * Leave `showLogout` alone unless a page genuinely has no business offering
 * an account control. It defaults to true, and the menu resolves the real
 * session to show "Log in" or "Log out" -- so switching it off just hides the
 * only way in or out of an account on that page.
 *
 * @example Hub header with custom left side, settings link, and gradient overlay
 * ```tsx
 * <PageHeader
 *   as="header"
 *   left={<span className="text-base font-bold tracking-tight text-foreground">paul-explore</span>}
 *   right={<UserInfo />}
 *   showSettings
 *   overlay={<GradientOverlay />}
 *   zIndex="z-30"
 * />
 * ```
 */
export default function PageHeader({
  breadcrumbs,
  left,
  right,
  showSettings = true,
  showLogout = true,
  maxWidth = "max-w-5xl",
  zIndex = "z-20",
  overlay,
  as: Tag = "nav",
}: PageHeaderProps) {
  // At the top: a full-width frosted bar. Floating: the bar goes clear and
  // click-through, and the inner row becomes the pill.
  const frameClassName = `group/header sticky top-0 ${zIndex} min-h-14 border-b border-border bg-background/80 backdrop-blur-(--blur-bar) transition-[background-color,border-color] duration-300 data-[floating=true]:pointer-events-none data-[floating=true]:border-transparent data-[floating=true]:bg-transparent data-[floating=true]:backdrop-blur-none`;

  const content = (
    <>
      {overlay}
      <div
        className={`pointer-events-auto relative mx-auto ${maxWidth} px-4 sm:px-6 min-h-14 py-1.5 flex items-center gap-4 rounded-full border border-transparent transition-[max-width,margin,min-height,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none group-data-[floating=true]/header:my-1.5 group-data-[floating=true]/header:min-h-11 group-data-[floating=true]/header:max-w-3xl group-data-[floating=true]/header:border-border group-data-[floating=true]/header:bg-surface/80 group-data-[floating=true]/header:py-1 group-data-[floating=true]/header:pr-2 group-data-[floating=true]/header:pl-5 group-data-[floating=true]/header:shadow-[0_12px_32px_-16px_rgb(0_0_0/0.35)] group-data-[floating=true]/header:backdrop-blur-md group-data-[floating=true]/header:mx-3 sm:group-data-[floating=true]/header:mx-auto`}
      >
        {/* Left: breadcrumb trail or custom node */}
        {left ??
          (breadcrumbs && (
            <ol aria-label="Breadcrumb" className="contents">
              {breadcrumbs.map((item, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <li key={i} className="contents">
                    {i > 0 && (
                      <div
                        className="h-4 w-px bg-border shrink-0"
                        aria-hidden="true"
                      />
                    )}

                    {i === 0 && item.href === "/" ? (
                      <Link
                        href="/"
                        onClick={item.onClick}
                        className="flex min-h-11 shrink-0 items-center sm:min-h-0"
                      >
                        <Wordmark />
                      </Link>
                    ) : i === 0 && item.href ? (
                      <Link
                        href={item.href}
                        onClick={item.onClick}
                        className="flex min-h-11 shrink-0 items-center gap-1.5 font-mono text-[13px] text-muted transition-colors hover:text-foreground sm:min-h-0"
                      >
                        <BackChevron />
                        {item.label}
                      </Link>
                    ) : item.href ? (
                      <Link
                        href={item.href}
                        onClick={item.onClick}
                        className="flex min-h-11 shrink-0 items-center truncate font-mono text-[13px] text-muted transition-colors hover:text-foreground max-w-[120px] sm:min-h-0"
                      >
                        {item.label}
                      </Link>
                    ) : item.badge ? (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className="rounded-full bg-primary-100 px-2.5 py-0.5 font-mono text-[12px] font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      >
                        {item.label}
                      </span>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className="font-mono text-[13px] font-medium text-foreground truncate"
                      >
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          ))}

        {/* Right: hop to the other half of this page, optional slot, menu */}
        <div className="ml-auto flex items-center gap-3">
          {/* Renders only on a feature with a write-up, or a write-up about a
              feature -- nothing everywhere else. Thoughts pages get it too,
              since ThoughtLayout renders this same header. */}
          <FeatureThoughtsLink />
          {right}
          <HeaderMenu showSettings={showSettings} showLogout={showLogout} />
        </div>
      </div>
    </>
  );

  return (
    // A nav is named so it's distinguishable from any other nav on the page
    // (e.g. a prev/next pager), which axe's landmark-unique rule requires.
    <FloatingHeaderFrame
      as={Tag}
      ariaLabel={Tag === "nav" ? "Breadcrumb" : undefined}
      className={frameClassName}
    >
      {content}
    </FloatingHeaderFrame>
  );
}
