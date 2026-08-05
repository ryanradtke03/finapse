import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import type { TransactionFilters } from "../api/transactions";
import { Dropdown } from "../components/ui/Dropdown";
import { MultiSelectDropdown } from "../components/ui/MultiSelectDropdown";
import { TIME_FRAME_OPTIONS, presetRange } from "../lib/dateRanges";
import { useItems } from "../hooks/useItems";
import {
  useTransactionCategories,
  useTransactions,
  useTransactionSummary,
} from "../hooks/useTransactions";
import {
  getEffectiveCategory,
  getTransactionCategoryColor,
  getTransactionCategoryLabel,
} from "../lib/transactionCategories";

// same-length window immediately preceding the current one, for "vs last period"
function previousRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const rangeMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - rangeMs);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(prevStart), endDate: iso(prevEnd) };
}

function trendLabel(current: number, previous: number): string {
  if (previous === 0) {
    if (current === 0) return "0% vs last period";
    return "UP 100%+ vs last period";
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.05) return "0% vs last period";
  const dir = pct > 0 ? "UP" : "DOWN";
  return `${dir} ${Math.abs(pct).toFixed(1)}% vs last period`;
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Compact money for tight spots like the category legend (no cents).
function compactMoney(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

// "2026-07-06" → "Jul 6" (parsed as local midnight to avoid an off-by-one day).
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// A single account's contribution to total balance. Credit-card and loan
// balances are money *owed*, so they subtract; everything else (checking,
// savings, investments) adds. Null balances count as 0.
function signedBalance(a: { type: string; balanceCurrent: string | null }): number {
  if (a.balanceCurrent == null) return 0;
  const bal = Number(a.balanceCurrent);
  const t = a.type.toLowerCase();
  return t === "credit" || t === "loan" ? -bal : bal;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface-raised px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-brand-text-secondary">
        {label ? shortDate(label) : ""}
      </p>
      {payload.map((row) => (
        <p key={row.dataKey} className="text-brand-text">
          {row.dataKey === "spending" ? "Spending" : "Income"}:{" "}
          <span className="font-semibold">{formatMoney(row.value)}</span>
        </p>
      ))}
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { label: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface-raised px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-text-secondary">{row.payload.label}</p>
      <p className="font-semibold text-brand-text">{formatMoney(row.value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const [filters, setFilters] = useState<TransactionFilters>(
    presetRange("30d"),
  );
  const [timeFrame, setTimeFrame] = useState("30d");
  // Income shown by default on the time-series chart (FIN-109); the legend
  // still toggles it off.
  const [showIncome, setShowIncome] = useState(true);

  const items = useItems();
  const summary = useTransactionSummary(filters);
  const list = useTransactions({ ...filters, limit: 10 });

  // Full distinct-category list for the filter dropdown (same source the
  // Transactions page uses) so options aren't limited to categories that
  // happen to have spending in the current time frame, and come with colors.
  const categoriesQuery = useTransactionCategories();

  const prevFilters = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return undefined;
    return {
      ...filters,
      ...previousRange(filters.startDate, filters.endDate),
    };
  }, [filters]);
  const prevSummary = useTransactionSummary(prevFilters);

  const accounts = items.data?.flatMap((i) => i.accounts) ?? [];

  function setFilter<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  function applyPreset(preset: string) {
    setTimeFrame(preset);
    setFilters((prev) => ({ ...prev, ...presetRange(preset) }));
  }

  const spent = summary.data?.totalSpent ?? 0;
  const income = summary.data?.totalIncome ?? 0;
  const net = income - spent;

  const prevSpent = prevSummary.data?.totalSpent ?? 0;
  const prevIncome = prevSummary.data?.totalIncome ?? 0;
  const prevNet = prevIncome - prevSpent;

  // Point-in-time balance across accounts, respecting the Account filter.
  // Net of credit-card / loan debt (see signedBalance).
  const balanceAccounts = filters.accountId
    ? accounts.filter((a) => a.id === filters.accountId)
    : accounts;
  const totalBalance = balanceAccounts.reduce((s, a) => s + signedBalance(a), 0);
  const selectedAccount = filters.accountId
    ? accounts.find((a) => a.id === filters.accountId)
    : undefined;
  const hasDebt = balanceAccounts.some((a) => {
    const t = a.type.toLowerCase();
    return (
      (t === "credit" || t === "loan") &&
      a.balanceCurrent != null &&
      Number(a.balanceCurrent) !== 0
    );
  });
  const balanceSubtitle = selectedAccount
    ? `${selectedAccount.name}${selectedAccount.mask ? ` ··${selectedAccount.mask}` : ""}`
    : `across ${balanceAccounts.length} account${balanceAccounts.length === 1 ? "" : "s"}${
        hasDebt ? " · net of card & loan balances" : ""
      }`;

  const days =
    filters.startDate && filters.endDate
      ? Math.max(
          1,
          (new Date(filters.endDate).getTime() -
            new Date(filters.startDate).getTime()) /
            86400000,
        )
      : 30;

  // Fill every day in the selected range (not just days that had activity) so
  // the x-axis is a continuous, evenly-spaced timeline instead of a sparse,
  // jumpy one. Days with no transactions render as zero-height bars.
  const chartData = useMemo(() => {
    const byDate = new Map(
      (summary.data?.byDay ?? []).map((d) => [d.date, d]),
    );
    const start = filters.startDate;
    const end = filters.endDate;
    if (!start || !end) {
      return (summary.data?.byDay ?? []).map((d) => ({
        date: d.date,
        spending: d.spending,
        income: d.income,
      }));
    }
    const out: { date: string; spending: number; income: number }[] = [];
    for (let t = Date.parse(start); t <= Date.parse(end); t += 86400000) {
      const iso = new Date(t).toISOString().slice(0, 10);
      const row = byDate.get(iso);
      out.push({
        date: iso,
        spending: row?.spending ?? 0,
        income: row?.income ?? 0,
      });
    }
    return out;
  }, [summary.data, filters.startDate, filters.endDate]);

  const maxSpendDate = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, d) => (d.spending > max.spending ? d : max)).date;
  }, [chartData]);

  // Spending-by-category donut: top 6 slices, everything else folded into
  // "Other" so it stays legible regardless of how many categories exist.
  const donutData = useMemo(() => {
    const rows = summary.data?.byCategory ?? [];
    const sorted = [...rows].sort((a, b) => b.total - a.total);
    const slices = sorted.slice(0, 6).map((c) => ({
      key: c.category,
      label: getTransactionCategoryLabel(c.category),
      value: c.total,
      color: getTransactionCategoryColor(c.category),
    }));
    const restTotal = sorted.slice(6).reduce((sum, c) => sum + c.total, 0);
    if (restTotal > 0) {
      slices.push({
        key: "__other",
        label: "Other",
        value: restTotal,
        color: "#6b7280",
      });
    }
    return slices;
  }, [summary.data]);

  const accountOptions = [
    { value: "", label: "All Accounts" },
    ...accounts.map((a) => ({
      value: a.id,
      label: `${a.name}${a.mask ? ` ··${a.mask}` : ""}`,
    })),
  ];

  const categoryOptions = (categoriesQuery.data ?? []).map((value) => ({
    value,
    label: getTransactionCategoryLabel(value),
    color: getTransactionCategoryColor(value),
  }));

  // filters.category is typed string | string[] (shared with TransactionFilters);
  // the Dashboard only ever sets it as an array now — normalize for the control.
  const selectedCategories = Array.isArray(filters.category)
    ? filters.category
    : filters.category
      ? [filters.category]
      : [];

  return (
    <div className="flex flex-col gap-5">
      {/* filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Dropdown
            label="Account"
            value={filters.accountId ?? ""}
            options={accountOptions}
            onChange={(v) => setFilter("accountId", v)}
            className="w-48"
          />
          <Dropdown
            label="Time frame"
            value={timeFrame}
            options={TIME_FRAME_OPTIONS}
            onChange={applyPreset}
            className="w-44"
          />
          <MultiSelectDropdown
            label="Categories"
            values={selectedCategories}
            options={categoryOptions}
            onChange={(values) =>
              setFilters((prev) => ({
                ...prev,
                category: values.length ? values : undefined,
              }))
            }
            allLabel="All Categories"
            className="w-44"
          />
        </div>
      </div>

      {/* total balance — point-in-time, respects the account filter */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
        <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
          Total balance
        </p>
        <p
          className={`mt-1 text-3xl font-bold ${
            totalBalance < 0 ? "text-brand-error" : "text-brand-text"
          }`}
        >
          {totalBalance < 0 ? "-" : ""}
          {formatMoney(Math.abs(totalBalance))}
        </p>
        <p className="mt-1 text-xs text-brand-text-secondary">
          {balanceSubtitle}
        </p>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
            Spending
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-error">
            {formatMoney(spent)}
          </p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {trendLabel(spent, prevSpent)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
            Income
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-green">
            {formatMoney(income)}
          </p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {trendLabel(income, prevIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
            Net
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-text">
            {net >= 0 ? "+" : "-"}
            {formatMoney(Math.abs(net))}
          </p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {trendLabel(net, prevNet)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
            Avg / day
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-text">
            {formatMoney(days > 0 ? spent / days : 0)}
          </p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            over {Math.round(days)} days
          </p>
        </div>
      </div>

      {/* charts */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-brand-text">Spending over time</h3>
            <div className="flex items-center gap-4 text-xs text-brand-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                Spending
              </span>
              <button
                type="button"
                onClick={() => setShowIncome((v) => !v)}
                className="flex cursor-pointer items-center gap-1.5"
              >
                <span
                  className={`h-2 w-2 rounded-full ${showIncome ? "bg-brand-text-secondary" : "border border-brand-text-secondary bg-transparent"}`}
                />
                Income
              </button>
            </div>
          </div>

          {chartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-brand-text-secondary">
              No transactions in this period.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-brand-border-subtle)"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#777777", fontSize: 11 }}
                  tickFormatter={shortDate}
                  interval={Math.max(0, Math.ceil(chartData.length / 8) - 1)}
                  minTickGap={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#777777", fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--color-brand-border-subtle)" }}
                />
                <Bar dataKey="spending" radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell
                      key={d.date}
                      fill="var(--color-brand-green)"
                      fillOpacity={d.date === maxSpendDate ? 1 : 0.55}
                    />
                  ))}
                </Bar>
                {showIncome && (
                  <Bar
                    dataKey="income"
                    fill="var(--color-brand-text-secondary)"
                    fillOpacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="mb-4 font-semibold text-brand-text">
            Spending by category
          </h3>
          {donutData.length === 0 ? (
            <p className="py-16 text-center text-sm text-brand-text-secondary">
              No spending in this period.
            </p>
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={72}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donutData.map((d) => (
                        <Cell key={d.key} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-brand-text">
                    {formatMoney(spent)}
                  </span>
                  <span className="text-[10px] tracking-wide text-brand-text-secondary uppercase">
                    total spent
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {donutData.map((d) => (
                  <div
                    key={d.key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-brand-text">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="truncate">{d.label}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-medium text-brand-text">
                        {compactMoney(d.value)}
                      </span>
                      <span className="w-7 text-right text-brand-text-secondary">
                        {spent > 0 ? Math.round((d.value / spent) * 100) : 0}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* recent transactions */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-brand-text">Recent transactions</h3>
          <Link
            to="/transactions"
            className="text-sm text-brand-green hover:text-brand-green-hover"
          >
            View all
          </Link>
        </div>

        {list.isLoading && (
          <p className="text-sm text-brand-text-secondary">Loading…</p>
        )}

        <div className="flex flex-col">
          {list.data?.transactions.map((t) => {
            const label = t.merchantName ?? t.name;
            const amount = Number(t.amount);
            const isIncome = amount < 0;
            return (
              <div
                key={t.id}
                className="flex items-center justify-between border-t border-brand-border-subtle py-3 first:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-surface-raised text-sm font-medium text-brand-text-secondary">
                    {label.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{label}</p>
                    <p className="text-xs text-brand-text-secondary">
                      {getTransactionCategoryLabel(getEffectiveCategory(t))}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${isIncome ? "text-brand-green" : "text-brand-error"}`}
                >
                  {isIncome ? "+" : "-"}
                  {formatMoney(Math.abs(amount))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
