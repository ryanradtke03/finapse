import { LandingPageCard } from "../components/LandingPageCard";

export default function Landing() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-text grid grid-rows-[auto_1fr_auto]">
      <header className="border-b border-brand-border px-8 py-4">
        <div className="grid grid-cols-[1fr_2fr]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-green rounded-lg">
              {/** Logo Here */}
            </div>
            <span className="text-brand-text font-medium text-lg">
              Fin<span className="text-brand-green">apse</span>
            </span>
          </div>
            <div className="flex-1 flex justify-center gap-12">
              <button className={`
              text-brand-text 
                border border-brand-border
                rounded-xl px-6 py-2 cursor-pointer
                transition-all duration-200
                hover:bg-brand-green-hover
                `}>
                Features
              </button>
              <button className={`
                text-brand-text 
                border border-brand-border
                rounded-xl px-6 py-2 cursor-pointer
                transition-all duration-200
                hover:bg-brand-green-hover
                `}>
                Pricing
              </button>
              <button className={`
                text-brand-text
                border border-brand-border
                rounded-xl px-6 py-2 cursor-pointer
                transition-all duration-200
                hover:bg-brand-green-hover
                `}>
                Blog
              </button>
              <button className={`
                text-brand-text
                border border-brand-border
                rounded-xl px-6 py-2 cursor-pointer
                transition-all duration-200
                hover:bg-brand-green-hover
                `}>
                About
              </button>
            </div>
        </div>
      </header>
      <div className="grid grid-cols-[1fr_2fr]">
        <aside className="border-r border-brand-border px-6 py-8">
          Sidebar
        </aside>
        <section className="flex items-center justify-center px-8 py-8">
          <LandingPageCard />
        </section>
      </div>
      <footer className="border-t border-brand-border px-8 py-4 text-brand-hint">
        Footer
      </footer>
    </main>
  );
}
