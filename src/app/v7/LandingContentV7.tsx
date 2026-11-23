import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeader, { Wordmark } from "@/components/PageHeader";
import Hero from "./Hero";
import StackMarquee from "./StackMarquee";
import WorkGrid from "./WorkGrid";
import About from "./About";
import Proof from "./Proof";
import Contact from "./Contact";
import styles from "./v7.module.css";

const NAV = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Writing", href: "/thoughts" },
  { label: "Contact", href: "#contact" },
];

const FOOTER_LINKS = [
  { label: "GitHub", href: "https://github.com/gpbsumido" },
  { label: "NPM", href: "https://www.npmjs.com/~psumido" },
  { label: "Design system", href: "/design-system" },
];

/**
 * The v7 landing. It uses the same PageHeader and PageShell as every other
 * page, so the floating pill header and the drifting grid are the site's, not
 * the landing's; only the sections below are its own.
 */
export default function LandingContentV7() {
  return (
    <PageShell>
      <div className={styles.page}>
        <PageHeader
          as="header"
          maxWidth="max-w-[1240px]"
          zIndex="z-30"
          left={
            <Link href="/" className="flex min-h-11 items-center sm:min-h-0">
              <Wordmark />
            </Link>
          }
          right={
            <nav aria-label="On this page">
              <ul className={styles.navLinks}>
                {NAV.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>
                      <span className="brace">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          }
        />
        <main>
          <Hero />
          <StackMarquee />
          <WorkGrid />
          <About />
          <Proof />
          <Contact />
        </main>
        <footer className={`${styles.shell} ${styles.footer}`}>
          <div>
            <Link href="#hero">
              <Wordmark />
            </Link>
            <p>Paul Sumido. Lead frontend developer, Toronto.</p>
          </div>
          <ul className={styles.footerLinks}>
            {FOOTER_LINKS.map((item) => (
              <li key={item.label}>
                <Link href={item.href}>
                  <span className="brace">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </PageShell>
  );
}
