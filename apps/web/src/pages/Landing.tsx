import { useState } from "react";
import { AuthModal } from "../components/AuthModal";
import { FullLogo, LogoText } from "../components/Logo";

const NAV_LINKS = ["Features", "Pricing", "Blog", "About"];
const FOOTER_LINKS = ["Privacy", "Terms", "Contact"];

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

function NavLink({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        text-brand-text-secondary
        cursor-pointer
        transition-all duration-200
        hover:text-brand-text-hint
        `}
    >
      {label}
    </button>
  );
}

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

      {/* Content area — swap this out later */}
      <div className="aspect-video bg-[--color-brand-bg] flex items-center justify-center">
        <span className="text-sm text-[--color-brand-text-hint]">
          Dashboard preview
        </span>
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
  const [open, setOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"login" | "signup">("login");

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
            {NAV_LINKS.map((link) => (
              <NavLink key={link} label={link} />
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
            <button
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
            </button>
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
            {FOOTER_LINKS.map((link) => (
              <NavLink key={link} label={link} />
            ))}
          </div>
          <div className="text-sm text-right">
            <span>© 2026 Finapse</span>
          </div>
        </div>
      </footer>

      {/** Auth Modal */}
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        defaultTab={defaultTab}
      />
    </main>
  );
}
