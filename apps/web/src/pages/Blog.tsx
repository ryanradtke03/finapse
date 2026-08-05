import { Card, MarketingLayout, PageHero } from "../components/MarketingLayout";

const POSTS = [
  {
    tag: "Guides",
    title: "The 50/30/20 rule, explained simply",
    excerpt:
      "A no-nonsense framework for splitting your income between needs, wants, and savings.",
    date: "Coming soon",
  },
  {
    tag: "Product",
    title: "How Finapse categorizes your spending",
    excerpt:
      "A look under the hood at how transactions get sorted — and how you can override it.",
    date: "Coming soon",
  },
  {
    tag: "Money",
    title: "Building an emergency fund that actually sticks",
    excerpt:
      "Small, automatic habits beat big one-off deposits. Here's how to set them up.",
    date: "Coming soon",
  },
];

export default function Blog() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="BLOG"
        title="Notes on"
        highlight="money & clarity"
        subtitle="Practical writing on budgeting, saving, and getting a clear picture of your finances."
      />

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 pb-24 md:grid-cols-3">
        {POSTS.map((post) => (
          <Card key={post.title} className="flex flex-col gap-3">
            <span className="w-fit rounded-full bg-brand-green-muted px-2.5 py-0.5 text-xs font-medium text-brand-green">
              {post.tag}
            </span>
            <h3 className="text-base font-semibold text-brand-text">
              {post.title}
            </h3>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              {post.excerpt}
            </p>
            <span className="pt-2 text-xs text-brand-text-hint">
              {post.date}
            </span>
          </Card>
        ))}
      </div>
    </MarketingLayout>
  );
}
