import { Link } from "react-router-dom";
import { Card, MarketingLayout, PageHero } from "../components/MarketingLayout";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Everything you need to start tracking your money.",
    features: [
      "Connect one bank",
      "Unlimited transactions",
      "Budgets & categories",
      "Monthly reports",
    ],
    cta: "Start for free",
    highlight: false,
  },
  {
    name: "Plus",
    price: "$6",
    cadence: "per month",
    blurb: "For people getting serious about their goals.",
    features: [
      "Connect unlimited banks",
      "Savings goal tracker",
      "Investment overview",
      "Priority sync",
    ],
    cta: "Get Plus",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "per month",
    blurb: "Advanced insight for power users.",
    features: [
      "Everything in Plus",
      "Custom categories & rules",
      "Data export",
      "Early access features",
    ],
    cta: "Get Pro",
    highlight: false,
  },
];

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-brand-green"
    >
      <path d="M2 8.5L6 12l8-9" />
    </svg>
  );
}

export default function Pricing() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="PRICING"
        title="Simple pricing,"
        highlight="no surprises"
        subtitle="Start free and upgrade when you're ready. Cancel anytime."
      />

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 pb-24 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col gap-5 ${
              plan.highlight
                ? "border-brand-green/60 bg-brand-pill-bg"
                : ""
            }`}
          >
            <div>
              <h3 className="text-lg font-semibold text-brand-text">
                {plan.name}
              </h3>
              <div className="flex items-end gap-1 pt-2">
                <span className="text-4xl font-bold tracking-tight text-brand-text">
                  {plan.price}
                </span>
                <span className="pb-1 text-sm text-brand-text-secondary">
                  /{plan.cadence}
                </span>
              </div>
              <p className="pt-2 text-sm text-brand-text-secondary">
                {plan.blurb}
              </p>
            </div>

            <ul className="flex flex-col gap-2 text-sm text-brand-text-secondary">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/?auth=signup"
              className={`mt-auto inline-block cursor-pointer rounded-lg border-2 px-4 py-2 text-center text-sm font-semibold transition-all duration-200 ${
                plan.highlight
                  ? "border-brand-green bg-brand-green text-brand-bg hover:text-brand-text"
                  : "border-brand-border text-brand-text hover:bg-brand-green"
              }`}
            >
              {plan.cta}
            </Link>
          </Card>
        ))}
      </div>
    </MarketingLayout>
  );
}
