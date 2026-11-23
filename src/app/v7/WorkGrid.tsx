import Image from "next/image";
import Link from "next/link";
import { FEATURES } from "@/app/_shared/featureData.data";
import { previewSrc } from "../v5/featured";
import { workTiles } from "./picks";
import styles from "./v7.module.css";

/**
 * The shortlist: four apps on a staggered 12-column grid, screenshots in
 * grayscale until you point at one. Each tile is one link, so its title is its
 * accessible name and the screenshot alt can stay empty.
 */
export default function WorkGrid() {
  return (
    <section id="work" aria-labelledby="work-title" className={`${styles.shell} ${styles.section}`}>
      <h2 id="work-title" className={styles.sectionTitle}>
        Pick a rabbit hole<span className={styles.accent}>.</span>
      </h2>
      <ul className={styles.workGrid}>
        {workTiles().map((tile) => (
          <li key={tile.id}>
            <Link href={tile.href} className={styles.tile}>
              <div className={styles.tileMedia}>
                <Image src={previewSrc(tile.id, "light")} alt="" width={1280} height={800} sizes="(max-width: 860px) 92vw, 58vw" className={styles.lightShot} />
                <Image src={previewSrc(tile.id, "dark")} alt="" width={1280} height={800} sizes="(max-width: 860px) 92vw, 58vw" className={styles.darkShot} />
              </div>
              <div className={styles.tileCaption}>
                <div className={styles.tileMeta}>
                  <h3 className={styles.tileTitle}>{tile.title}</h3>
                  <span className={styles.go} aria-hidden="true">↗</span>
                  <span className={styles.chip}>{tile.category}</span>
                </div>
                <p className={styles.tileNote}>{tile.note}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className={styles.workFoot}>
        <p>
          This is the shortlist. There are <strong>{FEATURES.length}</strong> places to go.
        </p>
        <Link className={`${styles.btn} ${styles.btnOutline}`} href="/surprise">
          Surprise me <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
