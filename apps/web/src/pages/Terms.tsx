import { LegalSection, MarketingLayout, PageHero } from "../components/MarketingLayout";

export default function Terms() {
  return (
    <MarketingLayout>
      <PageHero eyebrow="TERMS" title="Terms of Service" />

      <div className="w-full max-w-2xl pb-24">
        <p className="text-sm text-brand-text-hint">Last updated: August 2026</p>

        <p className="pt-6 leading-relaxed text-brand-text-secondary">
          These are placeholder terms of service for Finapse. They set out the
          general rules for using the product. Replace this copy with your
          reviewed legal text before launch.
        </p>

        <LegalSection heading="Using Finapse">
          By creating an account you agree to use Finapse lawfully and to keep
          your login credentials secure. You're responsible for activity that
          happens under your account.
        </LegalSection>

        <LegalSection heading="Your data & accounts">
          Finapse connects to your financial institutions through a third-party
          banking provider to read transaction and balance data. You can revoke
          this access at any time by disconnecting a bank.
        </LegalSection>

        <LegalSection heading="No financial advice">
          Finapse provides tools to organize and visualize your money. It does
          not provide financial, tax, or investment advice. Decisions you make
          based on the app are your own.
        </LegalSection>

        <LegalSection heading="Availability">
          We work to keep Finapse running smoothly but don't guarantee
          uninterrupted access. Features may change as the product evolves.
        </LegalSection>

        <LegalSection heading="Contact">
          Questions about these terms? Reach us through the Contact page.
        </LegalSection>
      </div>
    </MarketingLayout>
  );
}
