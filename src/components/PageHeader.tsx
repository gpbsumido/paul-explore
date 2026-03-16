import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import HeaderMenu from "@/components/HeaderMenu";

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
 * Shared sticky page header used across all feature and thoughts pages.
 *
 * Renders a glassmorphic bar with a breadcrumb trail (or custom left content)
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
 * @example Thoughts page (no logout, narrow container, view toggle)
 * ```tsx
 * <PageHeader
 *   breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Calendar" }]}
 *   right={<ViewToggle view={view} setView={setView} />}
 *   showLogout={false}
 *   maxWidth="max-w-3xl"
 * />
 * ```
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
  showSettings = false,
  showLogout = true,
  maxWidth = "max-w-5xl",
  zIndex = "z-20",
  overlay,
  as: Tag = "nav",
}: PageHeaderProps) {
  const glassStyle = {
    background: "color-mix(in srgb, var(--color-background) 80%, transparent)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  };

  const navClassName = `sticky top-0 ${zIndex} h-14 border-b border-border`;

  const content = (
    <>
      {overlay}
      <div
        className={`relative mx-auto ${maxWidth} px-4 sm:px-6 h-full flex items-center gap-4`}
      >
        {/* Left: custom node or breadcrumb trail */}
        {left ??
          breadcrumbs?.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && <div className="h-4 w-px bg-border shrink-0" />}

              {i === 0 && item.href ? (
                <Link
                  href={item.href}
                  onClick={item.onClick}
                  className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
                >
                  <BackChevron />
                  {item.label}
                </Link>
              ) : item.href ? (
                <Link
                  href={item.href}
                  onClick={item.onClick}
                  className="shrink-0 text-sm text-muted transition-colors hover:text-foreground max-w-[120px] truncate"
                >
                  {item.label}
                </Link>
              ) : item.badge ? (
                <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  {item.label}
                </span>
              ) : (
                <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground truncate">
                  {item.label}
                </span>
              )}
            </Fragment>
          ))}

        {/* Right: optional slot + dropdown menu */}
        <div className="ml-auto flex items-center gap-3">
          {right}
          <HeaderMenu showSettings={showSettings} showLogout={showLogout} />
        </div>
      </div>
    </>
  );

  if (Tag === "header") {
    return (
      <header className={navClassName} style={glassStyle}>
        {content}
      </header>
    );
  }

  return (
    <nav className={navClassName} style={glassStyle}>
      {content}
    </nav>
  );
}
