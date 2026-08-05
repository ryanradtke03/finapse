import { Card, MarketingLayout, PageHero } from "../components/MarketingLayout";

const STATS = [
  { stat: "12k+", description: "People taking control of their finances" },
  { stat: "$2.4M", description: "Tracked in savings goals this month" },
  { stat: "4.9★", description: "Average rating from our users" },
];

export default function About() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="ABOUT"
        title="Personal finance,"
        highlight="simplified"
        subtitle="We're building the money app we always wanted — clear, calm, and honest about where your money actually goes."
      />

      <div className="flex w-full max-w-2xl flex-col gap-6 pb-10 text-brand-text-secondary">
        <p className="leading-relaxed">
          Most finance tools are either too basic to be useful or so complex
          they gather dust. Finapse sits in the middle: powerful enough to give
          you a real picture of your spending, budgets, and goals — without the
          spreadsheet energy.
        </p>
        <p className="leading-relaxed">
          Our approach is simple. Connect your accounts, and we do the tedious
          part — pulling transactions, categorizing them, and surfacing the
          trends that matter. You stay in control, with the final say on every
          category and budget.
        </p>
      </div>

      <div className="w-full max-w-2xl pb-24">
        <Card className="p-0">
          <div className="grid grid-cols-1 divide-y divide-brand-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS.map((s) => (
              <div key={s.stat} className="flex flex-col gap-3 p-8">
                <h3 className="text-4xl font-semibold tracking-tight text-brand-green">
                  {s.stat}
                </h3>
                <p className="text-sm leading-relaxed text-brand-text-secondary">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MarketingLayout>
  );
}
