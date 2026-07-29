import { useBudgets } from "../hooks/useBudgets";

export default function Budgets() {
  const q = useBudgets();

  return (
    <div style={{ padding: 24 }}>
      <h2>Budgets</h2>

      {q.isLoading && <p>Loading…</p>}
      {q.isError && <p>Couldn't load budgets.</p>}
      {q.data?.length === 0 && <p>No budgets yet.</p>}

      {q.data?.map((b) => (
        <div
          key={b.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 4px",
            borderBottom: "1px solid #eee",
          }}
        >
          <span>{b.category}</span>
          <span>{new Date(b.periodStart).toLocaleDateString()}</span>
          <span>${Number(b.limitAmount).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
