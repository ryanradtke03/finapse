import { LandingPageCard } from "../components/LandingPageCard";

export default function Landing() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-text grid grid-rows-[auto_1fr_auto]">
      <header className="border-b border-brand-border px-8 py-4">Header</header>
      <div className="grid grid-cols-[180px_1fr]">
        <aside className="border-r border-brand-border px-6 py-8">
          Sidebar
        </aside>
        <section className="px-8 py-8">
          <LandingPageCard />
        </section>
      </div>
      <footer className="border-t border-brand-border px-8 py-4 text-brand-hint">
        Footer
      </footer>
    </main>
  );
}
