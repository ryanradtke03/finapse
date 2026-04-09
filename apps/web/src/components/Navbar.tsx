export default function Navbar() {
    return (
      <header className="sticky top-0 z-50 border-b border-white/10 px-8 py-4 backdrop-blur-sm bg-[#0b0b0b]/80">
        <div className="flex items-center justify-between max-w-[1200px] mx-auto">
          <span className="font-semibold tracking-tight text-white text-lg">
            fin<span className="text-[#5fd93a]">apse</span>
          </span>
          <nav className="flex items-center gap-8 text-sm text-[#555555]">
            <span>Dashboard</span>
            <span>Transactions</span>
            <span>Budgets</span>
            <span>Savings</span>
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-sm text-white border border-white/10 rounded-lg px-3 py-1.5">Sync</button>
            <button className="text-sm text-white border border-white/10 rounded-lg px-3 py-1.5">Manage accounts</button>
          </div>
        </div>
      </header>
    );
  }