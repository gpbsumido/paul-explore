import styles from "./v7.module.css";

const EMAIL = "psumido@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("Hello Paul, I found you through paul-explore")}`;

/** The close: who this is for, and the two fastest ways to reach me. */
export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className={`${styles.shell} ${styles.section}`}>
      <h2 id="contact-title" className={styles.contactTitle}>
        If you&apos;re hiring a frontend dev<span className={styles.accent}>.</span>
      </h2>
      <p className={styles.contactLede}>
        The resume is one page and the evidence for all of it is on this domain. If the fit looks right, the fastest next step is an email.
      </p>
      <div className={styles.ctas}>
        <a className={`${styles.btn} ${styles.btnPrimary}`} href={MAILTO}>
          Email me <span aria-hidden="true">↗</span>
        </a>
        <a className={`${styles.btn} ${styles.btnOutline}`} href="https://calendly.com/psumido/30min">
          Book a 30-min call <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className={styles.address}>
        or copy it <code>{EMAIL}</code>
      </p>
    </section>
  );
}
