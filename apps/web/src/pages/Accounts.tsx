import { Avatar } from "../components/ui/Avatar";
import { useItems } from "../hooks/useItems";

export default function Accounts() {
  const q = useItems();

  return (
    <div style={{ padding: 24 }}>
      <h2>Accounts</h2>
      <Avatar name="John Doe" size="lg" className="mb-4" />

      {q.isLoading && <p>Loading…</p>}
      {q.isError && <p>Couldn't load accounts.</p>}
      {q.data?.length === 0 && <p>No banks connected yet.</p>}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {q.data?.map((item: any) => (
        <div key={item.id} style={{ margin: "16px 0" }}>
          <h3 style={{ marginBottom: 4 }}>{item.institutionName}</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
            {item.status}
          </p>

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {item.accounts.map((a: any) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 4px",
                borderBottom: "1px solid #eee",
              }}
            >
              <span>
                {a.name} {a.mask ? `··${a.mask}` : ""}
              </span>
              <span>{a.subtype ?? a.type}</span>
              <span>
                {a.balanceCurrent != null
                  ? `$${Number(a.balanceCurrent).toFixed(2)}`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
