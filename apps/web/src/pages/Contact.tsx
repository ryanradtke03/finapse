import { Card, MarketingLayout, PageHero } from "../components/MarketingLayout";

const CHANNELS = [
  {
    label: "Email",
    value: "hello@finapse.com",
    href: "mailto:hello@finapse.com",
  },
  {
    label: "Support",
    value: "support@finapse.com",
    href: "mailto:support@finapse.com",
  },
];

export default function Contact() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="CONTACT"
        title="Get in"
        highlight="touch"
        subtitle="Questions, feedback, or just want to say hi? We'd love to hear from you."
      />

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 pb-24 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <Card key={c.label} className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-brand-text-hint">
              {c.label}
            </span>
            <a
              href={c.href}
              className="cursor-pointer text-lg font-semibold text-brand-green transition-colors duration-200 hover:text-brand-text"
            >
              {c.value}
            </a>
          </Card>
        ))}
      </div>
    </MarketingLayout>
  );
}
