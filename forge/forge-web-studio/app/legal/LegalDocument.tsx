import Link from 'next/link';
import styles from './legal.module.css';

export type LegalSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type LegalDocumentProps = {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate: string;
  sections: LegalSection[];
};

export default function LegalDocument({
  eyebrow,
  title,
  summary,
  effectiveDate,
  sections,
}: LegalDocumentProps) {
  return (
    <main className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.header}>
        <Link className={styles.brand} href="/landing" aria-label="Forge home">
          <span className={styles.brandMark}>F</span>
          <span>FORGE</span>
        </Link>
        <nav className={styles.headerNav} aria-label="Legal pages">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link className={styles.enterLink} href="/login">Enter Forge</Link>
        </nav>
      </header>

      <div className={styles.frame}>
        <aside className={styles.rail}>
          <div className={styles.railLabel}>LEGAL / {eyebrow}</div>
          <div className={styles.railRule} />
          <p>Clear boundaries for human-directed AI work.</p>
        </aside>

        <article className={styles.document}>
          <section className={styles.hero}>
            <div className={styles.statusLine}>
              <span>{eyebrow}</span>
              <span>Effective {effectiveDate}</span>
            </div>
            <h1>{title}</h1>
            <p>{summary}</p>
          </section>

          <div className={styles.contentGrid}>
            <nav className={styles.toc} aria-label={`${title} contents`}>
              <span>IN THIS DOCUMENT</span>
              {sections.map((section, index) => (
                <a href={`#${section.id}`} key={section.id}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  {section.title}
                </a>
              ))}
            </nav>

            <div className={styles.sections}>
              {sections.map((section, index) => (
                <section className={styles.section} id={section.id} key={section.id}>
                  <div className={styles.sectionNumber}>{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <h2>{section.title}</h2>
                    <div className={styles.prose}>{section.content}</div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </article>
      </div>

      <footer className={styles.footer}>
        <span>© 2026 Forge</span>
        <span>Human approval remains the final control boundary.</span>
        <a href="mailto:support@forge.ai">support@forge.ai</a>
      </footer>
    </main>
  );
}
