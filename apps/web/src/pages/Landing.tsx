import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthModal } from "../components/AuthModal";
import { FullLogo, LogoText } from "../components/Logo";
import {
  MARKETING_FOOTER_LINKS,
  MARKETING_NAV_LINKS,
} from "../components/MarketingLayout";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  account_exists:
    "An account with this email already exists. Log in with your password.",
  google_failed: "Google sign-in failed. Please try again.",
};

// Finapse is a portfolio project — link the source so visitors can read the code.
const REPO_URL = "https://github.com/ryanradtke03/finapse";

function GitHubMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "At-a-glance dashboard",
    description:
      "See income, spending, and savings in one clean view — updated in real time.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-brand-green"
      >
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    title: "Smart budget categories",
    description:
      "Set limits per category and get warned before you go over — not after.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-brand-green"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4v4l2 1.5" />
      </svg>
    ),
  },
  {
    title: "Savings goal tracker",
    description:
      "Set a target, track progress, and see exactly when you'll hit it.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-brand-green"
      >
        <path d="M2 11L6 7l3 3 5-6" />
      </svg>
    ),
  },
  {
    title: "Full transaction history",
    description:
      "Every transaction in one place, filterable by category, date, or amount.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-brand-green"
      >
        <path d="M2 4h12M2 8h12M2 12h8" />
      </svg>
    ),
  },
  {
    title: "Monthly reports",
    description:
      "Understand how your habits change month to month with clean trend charts.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-brand-green"
      >
        <rect x="2" y="2" width="12" height="12" rx="1.5" />
        <path d="M5 8h6M8 5v6" />
      </svg>
    ),
  },
  {
    title: "Investments overview",
    description:
      "Track your portfolio alongside your day-to-day budget in one unified view.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-brand-green"
      >
        <path d="M2 12l3.5-4 3 2.5 3-4 2.5 2" />
        <circle cx="13" cy="4" r="1.5" />
      </svg>
    ),
  },
];

const STATS = [
  {
    stat: "12k+",
    description: "People taking control of their finances",
  },
  {
    stat: "$2.4M",
    description: "Tracked in savings goals this month",
  },
  {
    stat: "4.9★",
    description: "Average rating from our users",
  },
];

function NavLink({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to}
      className={`
        text-brand-text-secondary
        cursor-pointer
        transition-all duration-200
        hover:text-brand-text-hint
        `}
    >
      {label}
    </Link>
  );
}

// Static, lightweight mock of the real dashboard for the landing hero — no data
// or chart deps, just brand-styled markup that mirrors the actual product.
const PREVIEW_STATS = [
  { label: "Balance", value: "$12,480", accent: "text-brand-text" },
  { label: "Spending", value: "$2,840", accent: "text-brand-error" },
  { label: "Income", value: "$4,200", accent: "text-brand-green" },
  { label: "Avg / day", value: "$95", accent: "text-brand-text" },
];

const PREVIEW_BARS = [40, 55, 30, 72, 45, 50, 35, 62, 42, 58, 33, 48, 60, 38];

const PREVIEW_LEGEND = [
  { label: "Groceries", pct: "32%", color: "#eab308" },
  { label: "Dining", pct: "24%", color: "#f97316" },
  { label: "Transport", pct: "18%", color: "#14b8a6" },
  { label: "Other", pct: "26%", color: "#6b7280" },
];

function Preview() {
  return (
    <div className="w-full max-w-4xl rounded-2xl border border-[--color-brand-border-subtle] overflow-hidden">
      {/* Chrome bar — the fake macOS window top */}
      <div className="h-9 bg-[--color-brand-surface] border-b border-[--color-brand-border] flex items-center px-4 gap-2">
        {/* Traffic lights */}
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />

        {/* Fake URL bar */}
        <div className="mx-auto text-xs text-[--color-brand-text-hint] bg-[--color-brand-bg] border border-[--color-brand-border] px-4 py-1 rounded-md">
          app.finapse.com/dashboard
        </div>
      </div>

      {/* Content — a mini dashboard */}
      <div className="flex aspect-video flex-col gap-2.5 bg-brand-bg p-3 sm:p-4">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-2">
          {PREVIEW_STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-brand-border-subtle bg-brand-surface px-3 py-2"
            >
              <p className="text-[9px] uppercase tracking-wide text-brand-text-secondary">
                {s.label}
              </p>
              <p className={`text-sm font-bold ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid flex-1 grid-cols-[1.6fr_1fr] gap-2">
          {/* Spending over time */}
          <div className="flex flex-col rounded-lg border border-brand-border-subtle bg-brand-surface p-3">
            <p className="mb-2 text-[11px] font-semibold text-brand-text">
              Spending over time
            </p>
            <div className="flex flex-1 items-end gap-[3px]">
              {PREVIEW_BARS.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-brand-green"
                  style={{ height: `${h}%`, opacity: h > 68 ? 1 : 0.55 }}
                />
              ))}
            </div>
          </div>

          {/* Spending by category */}
          <div className="flex items-center gap-3 rounded-lg border border-brand-border-subtle bg-brand-surface p-3">
            <div
              className="relative h-16 w-16 shrink-0 rounded-full"
              style={{
                background:
                  "conic-gradient(#eab308 0 32%, #f97316 32% 56%, #14b8a6 56% 74%, #6b7280 74% 100%)",
              }}
            >
              <div className="absolute inset-[24%] rounded-full bg-brand-surface" />
            </div>
            <div className="flex flex-col gap-1">
              {PREVIEW_LEGEND.map((l) => (
                <div
                  key={l.label}
                  className="flex items-center gap-1.5 text-[10px]"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="text-brand-text">{l.label}</span>
                  <span className="ml-auto pl-2 text-brand-text-secondary">
                    {l.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 flex flex-col gap-4">
      {/** Logo */}
      <div className="w-12 h-12 rounded-xl bg-brand-green-muted flex items-center justify-center">
        {icon}
      </div>
      {/** Text */}
      <div>
        <h3 className="text-base font-semibold text-brand-text mb-2">
          {title}
        </h3>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  stat,
  description,
}: {
  stat: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h3 className="text-brand-green font-semibold tracking-tight text-4xl">
        {stat}
      </h3>
      <p className="text-brand-text-secondary leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}

export default function Landing() {
  // Two ways the modal can open on mount:
  // • ?authError=… — a bounced Google sign-in (FIN-103) redirects back with a
  //   code so we can reopen login with the message.
  // • ?auth=login|signup — the marketing subpages (FIN-101) deep-link here to
  //   open the modal on the right tab, since the landing page owns it.
  const initialParams = new URLSearchParams(window.location.search);
  const initialAuthCode = initialParams.get("authError");
  const initialAuthTab = initialParams.get("auth");
  const [open, setOpen] = useState(
    !!initialAuthCode || initialAuthTab === "login" || initialAuthTab === "signup",
  );
  const [defaultTab, setDefaultTab] = useState<"login" | "signup">(
    initialAuthTab === "signup" ? "signup" : "login",
  );
  const [authError, setAuthError] = useState(
    initialAuthCode
      ? (AUTH_ERROR_MESSAGES[initialAuthCode] ?? AUTH_ERROR_MESSAGES.google_failed)
      : "",
  );

  // Strip the params so a refresh doesn't reopen the modal. History API (not
  // setSearchParams) so there's no state update inside the effect.
  useEffect(() => {
    if (!initialAuthCode && !initialAuthTab) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("authError");
    url.searchParams.delete("auth");
    window.history.replaceState({}, "", url);
  }, [initialAuthCode, initialAuthTab]);

  return (
    <main
      className={`
      min-h-screen
      bg-brand-bg
      text-brand-text
      grid grid-rows-[auto_1fr_auto]
    `}
    >
      {/** Header */}
      <header className="sticky top-0 z-50 border-b border-brand-border-subtle px-8 py-4 backdrop-blur-sm bg-brand-bg/80">
        <div className="grid grid-cols-[1fr_2fr_1fr]">
          {/** Logo */}
          <FullLogo />
          {/** Nav Buttons */}
          <div className="flex items-center justify-between pr-24">
            {MARKETING_NAV_LINKS.map((link) => (
              <NavLink key={link.to} label={link.label} to={link.to} />
            ))}
          </div>
          {/** Launch Buttons */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => {
                setDefaultTab("login");
                setOpen(true);
              }}
              className={`
              text-md
              text-brand-text
              border-2 border-brand-border
              rounded-lg px-4 py-1 cursor-pointer
              transition-all duration-200
              hover:bg-brand-green-hover
              `}
            >
              Log in
            </button>
            <button
              onClick={() => {
                setDefaultTab("signup");
                setOpen(true);
              }}
              className={`
            text-md
            text-brand-bg
            border-2 bg-brand-green border-brand-green
            rounded-lg px-2 py-1 cursor-pointer
            transition-all duration-200
            hover:text-brand-text
              `}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/** Main Content */}
      <div
        className={`
          flex flex-col items-center
        `}
      >
        {/** Hero */}
        <div className="flex flex-col items-center py-4 pt-16">
          <div
            className={`
            text-sm
            text-brand-pill-text
            bg-brand-pill-bg
            border border-brand-pill-border
            rounded-xl
            px-4
            `}
          >
            <span>PERSONAL FINANCE, SIMPLIFIED</span>
          </div>
          <div className="flex items-center py-6">
            <h1 className="text-brand-text text-center font-extrabold text-6xl tracking-tight max-w-2xl">
              Know exactly where your{" "}
              <span className="text-brand-green">money goes</span>
            </h1>
          </div>
          <div className="pb-6">
            <span className="text-brand-text-secondary">
              Finapse tracks your spending, budgets, and savings goals — all in
              one clean dashboard
            </span>
          </div>
          <div className="flex flex-row items-center gap-4">
            <button
              onClick={() => {
                setDefaultTab("signup");
                setOpen(true);
              }}
              className={`
                text-brand-text
                text-sm font-semibold
                border-2 border-brand-border px-2 py-1
                rounded-lg cursor-pointer
                transition-all duration-200
                hover:bg-brand-green
              `}
            >
              Start for free
            </button>
            <Link
              to="/features"
              className={`
                text-brand-text
                text-sm font-semibold
                border-2 border-brand-border px-2 py-1
                rounded-lg cursor-pointer
                transition-all duration-200
                hover:bg-brand-green
              `}
            >
              See how it works →
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                inline-flex items-center gap-1.5
                text-brand-text
                text-sm font-semibold
                border-2 border-brand-border px-2 py-1
                rounded-lg cursor-pointer
                transition-all duration-200
                hover:bg-brand-green
              `}
            >
              <GitHubMark />
              View the code
            </a>
          </div>
        </div>

        {/** Preview */}
        <div className="py-8 ">
          <Preview />
        </div>

        {/** Info */}
        <div className="w-full max-w-2xl flex flex-col py-6">
          <span
            className={`
            text-left
            text-sm
            text-brand-green

            `}
          >
            WHAT'S INSIDE
          </span>
          <span
            className={`
              text-brand-text
              font-bold tracking-tight
              text-left
              text-3xl
              pt-2
            `}
          >
            Everything you need, nothing you don't
          </span>
          <span
            className={`
              text-brand-text-secondary
              text-md
            `}
          >
            Built for people who want clarity over complexity.
          </span>
        </div>

        {/** Feature Cards */}
        <div className="py-8">
          <div className="border border-brand-border-subtle rounded-2xl overflow-hidden max-w-2xl">
            <div className="grid grid-cols-3 divide-x divide-y divide-brand-border-subtle">
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </div>

        {/** Stat Cards */}
        <div className="py-8">
          <div className="border border-brand-border-subtle rounded-2xl overflow-hidden max-w-2xl">
            <div className="grid grid-cols-3 divide-x divide-y divide-brand-border-subtle">
              {STATS.map((f) => (
                <StatCard key={f.stat} {...f} />
              ))}
            </div>
          </div>
        </div>

        {/** Final Engage */}
        <div
          className={`
          m-8 mb-16 py-12 bg-brand-pill-bg w-full border border-brand-pill-border
          rounded-2xl
          flex flex-col items-center
          `}
        >
          <h3 className="text-brand-text font-semibold tracking-light text-3xl">
            Ready to take control?
          </h3>
          <p className="pt-2 text-brand-text-secondary text-md">
            Free to start. No credit required
          </p>
          <div className="p-4 flex flex-row items-center gap-4">
            <button
              onClick={() => {
                setDefaultTab("signup");
                setOpen(true);
              }}
              className={`
                text-brand-text
                text-sm font-semibold
                border-2 border-brand-border px-2 py-1
                rounded-lg cursor-pointer
                transition-all duration-200
                hover:bg-brand-green
              `}
            >
              Create your account
            </button>
            <button
              onClick={() => {
                setDefaultTab("login");
                setOpen(true);
              }}
              className={`
                text-brand-text
                text-sm font-semibold
                border-2 border-brand-border px-2 py-1
                rounded-lg cursor-pointer
                transition-all duration-200
                hover:bg-brand-green
              `}
            >
              Log in →
            </button>
          </div>
        </div>
      </div>

      {/** Footer */}
      <footer
        className={`
        border-t border-brand-border-subtle px-8 pb-6 pt-3 text-brand-text-hint
        `}
      >
        <div className="grid grid-cols-[1fr_2fr_1fr]">
          <div className="pl-12">
            <LogoText />
          </div>
          <div className="flex items-center justify-center gap-32 text-sm">
            {MARKETING_FOOTER_LINKS.map((link) => (
              <NavLink key={link.to} label={link.label} to={link.to} />
            ))}
          </div>
          <div className="flex items-center justify-end gap-4 text-sm">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-text-secondary"
            >
              <GitHubMark />
              GitHub
            </a>
            <span>© 2026 Finapse</span>
          </div>
        </div>
      </footer>

      {/** Auth Modal */}
      <AuthModal
        open={open}
        onClose={() => {
          setOpen(false);
          setAuthError("");
        }}
        defaultTab={defaultTab}
        initialError={authError}
      />
    </main>
  );
}
