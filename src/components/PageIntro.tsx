import styles from "@/app/page.module.css";

// heading + subtitle block used on most pages
export default function PageIntro({
  heading,
  subtitle,
}: {
  heading: string;
  subtitle: string;
}) {
  return (
    <div className={styles.intro}>
      <h1>{heading}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
