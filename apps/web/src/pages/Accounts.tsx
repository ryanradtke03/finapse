import { Avatar } from "../components/ui/Avatar";
import { useItems } from "../hooks/useItems";

export default function Accounts() {
  const q = useItems();

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-brand-text">Accounts</h2>
      <Avatar name="Chase Guttman" size="lg" className="mb-4" />

      {q.isLoading && <p className="text-brand-text-secondary">Loading…</p>}
      {q.isError && (
        <p className="text-brand-error">Couldn't load accounts.</p>
      )}
      {q.data?.length === 0 && (
        <p className="text-brand-text-secondary">No banks connected yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {q.data?.map((item: any) => (
          <div
            key={item.id}
            className="rounded-xl border border-brand-border bg-brand-surface p-4"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-medium text-brand-text">
                {item.institutionName}
              </h3>
              <span className="text-xs uppercase tracking-wide text-brand-text-secondary">
                {item.status}
              </span>
            </div>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {item.accounts.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between border-b border-brand-border-subtle py-3 last:border-b-0"
              >
                <span className="text-brand-text">
                  {a.name} {a.mask ? `··${a.mask}` : ""}
                </span>
                <span className="text-brand-text-secondary">
                  {a.subtype ?? a.type}
                </span>
                <span className="font-medium text-brand-text">
                  {a.balanceCurrent != null
                    ? `$${Number(a.balanceCurrent).toFixed(2)}`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
