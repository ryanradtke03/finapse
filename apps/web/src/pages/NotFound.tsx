import { Link } from "react-router-dom";
import { FullLogo } from "../components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-brand-bg text-brand-text">
      <header className="px-8 py-4">
        <Link to="/" aria-label="Finapse home">
          <FullLogo />
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="text-7xl font-extrabold tracking-tight text-brand-green">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-text">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-brand-text-secondary">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-lg border-2 border-brand-green bg-brand-green px-5 py-2.5 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:text-brand-text"
          >
            Back to home
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg border-2 border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-text transition-colors duration-200 hover:bg-brand-surface"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
