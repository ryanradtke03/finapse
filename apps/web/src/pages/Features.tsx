import { Link } from "react-router-dom";
import { Card, MarketingLayout, PageHero } from "../components/MarketingLayout";

const FEATURES = [
  {
    title: "At-a-glance dashboard",
    description:
      "See income, spending, and savings in one clean view — updated in real time.",
  },
  {
    title: "Smart budget categories",
    description:
      "Set limits per category and get warned before you go over — not after.",
  },
  {
    title: "Savings goal tracker",
    description:
      "Set a target, track progress, and see exactly when you'll hit it.",
  },
  {
    title: "Full transaction history",
    description:
      "Every transaction in one place, filterable by category, date, or amount.",
  },
  {
    title: "Monthly reports",
    description:
      "Understand how your habits change month to month with clean trend charts.",
  },
  {
    title: "Investments overview",
    description:
      "Track your portfolio alongside your day-to-day budget in one unified view.",
  },
];

export default function Features() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="WHAT'S INSIDE"
        title="Everything you need,"
        highlight="nothing you don't"
        subtitle="Built for people who want clarity over complexity. Here's what you get from day one."
      />

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="flex flex-col gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green-muted">
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-brand-green"
              >
                <path d="M2 10L5.5 6.5L8 9L12 4" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-brand-text">{f.title}</h3>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              {f.description}
            </p>
          </Card>
        ))}
      </div>

      <div className="pb-24">
        <Link
          to="/?auth=signup"
          className="inline-block cursor-pointer rounded-lg border-2 border-brand-green bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-all duration-200 hover:text-brand-text"
        >
          Start for free
        </Link>
      </div>
    </MarketingLayout>
  );
}
