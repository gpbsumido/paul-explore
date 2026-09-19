import Link from "next/link";
import LandingActions from "../v4/LandingActions";
import Proof from "../v5/sections/Proof";
import Contact from "../v5/sections/Contact";
import PlaygroundHero from "./PlaygroundHero";
import ProjectCollection from "./ProjectCollection";
import DetailsHeading from "./DetailsHeading";
import FieldNotes from "./FieldNotes";
import styles from "./playground.module.css";

export default function LandingContentV6() {
  return (
    <div className={styles.page}>
      <header className={`${styles.header} sticky top-0`}>
        <Link href="/" className={styles.brand}>paul<span className={styles.accent}>—</span>explore<span className={styles.brandDot} aria-hidden="true" /></Link>
        <nav aria-label="On this page" className={styles.nav}><a href="#work">Work</a><Link href="/thoughts">Writing</Link><a href="#contact">Say hello <span aria-hidden="true">↗</span></a></nav>
        <LandingActions />
      </header>
      <main>
        <PlaygroundHero />
        <ProjectCollection />
        <div className={styles.proof}><p className={styles.eyebrow}>03 / Under the surface</p><DetailsHeading /><Proof /></div>
        <div className={styles.writing}><p className={styles.eyebrow}>04 / Field notes</p><FieldNotes /></div>
        <Contact variant="blob" />
      </main>
      <footer className={styles.footer}><Link href="/">Paul Sumido / Toronto</Link><Link href="/design-system">Built with my design system ↗</Link><Link href="/discover?version=v5">Previous edition ↗</Link><a href="#hero">Back to the playground ↑</a></footer>
    </div>
  );
}
