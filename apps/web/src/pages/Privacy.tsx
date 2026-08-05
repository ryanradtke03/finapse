import { LegalSection, MarketingLayout, PageHero } from "../components/MarketingLayout";

export default function Privacy() {
  return (
    <MarketingLayout>
      <PageHero eyebrow="PRIVACY" title="Privacy Policy" />

      <div className="w-full max-w-2xl pb-24">
        <p className="text-sm text-brand-text-hint">Last updated: August 2026</p>

        <p className="pt-6 leading-relaxed text-brand-text-secondary">
          This is a placeholder privacy policy for Finapse. It describes, in
          general terms, how we handle your information. Replace this copy with
          your reviewed legal text before launch.
        </p>

        <LegalSection heading="Information we collect">
          We collect the information you provide when you create an account
          (such as your name and email) and the financial data you choose to
          connect through our banking partner. We do not sell your personal
          information.
        </LegalSection>

        <LegalSection heading="How we use your data">
          Your data is used to provide the service — syncing transactions,
          categorizing spending, and showing budgets and reports. We use it to
          operate, maintain, and improve Finapse.
        </LegalSection>

        <LegalSection heading="Data security">
          Sensitive credentials, including bank access tokens, are encrypted at
          rest. We take reasonable measures to protect your information, though
          no system can be guaranteed perfectly secure.
        </LegalSection>

        <LegalSection heading="Your choices">
          You can disconnect a bank, delete individual accounts, or delete your
          Finapse account entirely at any time from your settings. Deleting your
          account removes your associated data.
        </LegalSection>

        <LegalSection heading="Contact">
          Questions about this policy? Reach us through the Contact page.
        </LegalSection>
      </div>
    </MarketingLayout>
  );
}
