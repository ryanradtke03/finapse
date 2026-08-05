import { Link } from "react-router-dom";
import { FullLogo, LogoText } from "./Logo";

// Marketing nav + footer targets. Kept here so every marketing page (and the
// Landing page) links to the same set of routes (FIN-101).
export const MARKETING_NAV_LINKS = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
];

export const MARKETING_FOOTER_LINKS = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Contact", to: "/contact" },
];

// The landing page owns the auth modal; marketing subpages deep-link back to it
// with ?auth=login|signup, which Landing reads on mount to open the right tab.
function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border-subtle bg-brand-bg/80 px-8 py-4 backdrop-blur-sm">
      <div className="grid grid-cols-[1fr_2fr_1fr]">
        <Link to="/" aria-label="Finapse home">
          <FullLogo />
        </Link>
        <div className="flex items-center justify-between pr-24">
          {MARKETING_NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="cursor-pointer text-brand-text-secondary transition-all duration-200 hover:text-brand-text-hint"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6">
          <Link
            to="/?auth=login"
            className="inline-block cursor-pointer rounded-lg border-2 border-brand-border px-4 py-1 text-md text-brand-text transition-all duration-200 hover:bg-brand-green-hover"
          >
            Log in
          </Link>
          <Link
            to="/?auth=signup"
            className="inline-block cursor-pointer rounded-lg border-2 border-brand-green bg-brand-green px-2 py-1 text-md text-brand-bg transition-all duration-200 hover:text-brand-text"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-brand-border-subtle px-8 pb-6 pt-3 text-brand-text-hint">
      <div className="grid grid-cols-[1fr_2fr_1fr]">
        <div className="pl-12">
          <Link to="/">
            <LogoText />
          </Link>
        </div>
        <div className="flex items-center justify-center gap-32 text-sm">
          {MARKETING_FOOTER_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="cursor-pointer text-brand-text-hint transition-all duration-200 hover:text-brand-text"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="text-right text-sm">
          <span>© 2026 Finapse</span>
        </div>
      </div>
    </footer>
  );
}

/**
 * Shell for the generic marketing pages (Features, Pricing, Blog, About,
 * Privacy, Terms, Contact). Mirrors the Landing header/footer but with real
 * router links so nothing is a dead end.
 */
export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-brand-bg text-brand-text">
      <MarketingHeader />
      <div className="flex w-full flex-col items-center px-8">{children}</div>
      <MarketingFooter />
    </main>
  );
}

// ── Shared styled primitives, matching the Landing visual language ──────────

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-pill-border bg-brand-pill-bg px-4 py-0.5 text-sm text-brand-pill-text">
      {children}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center pb-8 pt-20 text-center">
      {eyebrow && <Pill>{eyebrow}</Pill>}
      <h1 className="max-w-2xl pt-6 text-5xl font-extrabold tracking-tight text-brand-text">
        {title} {highlight && <span className="text-brand-green">{highlight}</span>}
      </h1>
      {subtitle && (
        <p className="max-w-xl pt-4 text-brand-text-secondary">{subtitle}</p>
      )}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-brand-border-subtle bg-brand-surface/40 p-8 ${className}`}
    >
      {children}
    </div>
  );
}

// A titled prose block used by the legal pages (Privacy, Terms).
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 pt-8">
      <h2 className="text-xl font-bold tracking-tight text-brand-text">
        {heading}
      </h2>
      <p className="leading-relaxed text-brand-text-secondary">{children}</p>
    </section>
  );
}
