import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
        <span className="font-bold text-foreground">paul-explore</span>

        <span className="text-sm text-muted">&copy; 2026</span>

        <nav className="flex gap-4">
          <a
            href="https://github.com/gpbsumido"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <Link
            href="/thoughts"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Thoughts
          </Link>
          <Link
            href="?version=v1"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            View v1 &rarr;
          </Link>
        </nav>
      </div>
    </footer>
  );
}
