import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
      <p className="mb-1 text-brand-text-secondary">Day {label}</p>
      {payload.map((row) => (
        <p key={row.dataKey} className="text-brand-text">
          {row.dataKey === "spending" ? "Spending" : "Income"}:{" "}
          <span className="font-semibold">{formatMoney(row.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [filters, setFilters] = useState<TransactionFilters>(
    presetRange("30d"),
  );
  const [timeFrame, setTimeFrame] = useState("30d");
  const [chartMode, setChartMode] = useState<"total" | "category" | "avg">(
    "total",
  );
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
  const categories = summary.data?.byCategory ?? [];

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

  const days =
    filters.startDate && filters.endDate
      ? Math.max(
          1,
          (new Date(filters.endDate).getTime() -
            new Date(filters.startDate).getTime()) /
            86400000,
        )
      : 30;

  const chartData = useMemo(
    () =>
      (summary.data?.byDay ?? []).map((d) => ({
        date: d.date,
        day: Number(d.date.slice(8, 10)),
        spending: d.spending,
        income: d.income,
      })),
    [summary.data],
  );

  const maxSpendDate = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, d) => (d.spending > max.spending ? d : max)).date;
  }, [chartData]);

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

        <div className="flex items-center gap-1 rounded-xl border border-brand-border bg-brand-surface p-1">
          {(["total", "category", "avg"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setChartMode(m)}
              className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                chartMode === m
                  ? "bg-brand-green text-brand-bg font-semibold"
                  : "text-brand-text-secondary hover:text-brand-text"
              }`}
            >
              {m === "total"
                ? "Total"
                : m === "category"
                  ? "By category"
                  : "Avg/day"}
            </button>
          ))}
        </div>
      </div>

      {/* summary strip */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-brand-border bg-brand-surface p-5">
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
        <div className="flex-1 rounded-xl border border-brand-border bg-brand-surface p-5">
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
        <div className="flex-1 rounded-xl border border-brand-border bg-brand-surface p-5">
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
      </div>

      {/* chart + recent transactions */}
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          {chartMode === "total" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-brand-text">
                  Spending over time
                </h3>
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
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#777777", fontSize: 11 }}
                      label={{
                        value: "Day of month",
                        position: "insideBottom",
                        offset: -5,
                        fill: "#777777",
                        fontSize: 11,
                      }}
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
            </>
          )}

          {chartMode === "category" && (
            <>
              <h3 className="mb-4 font-semibold text-brand-text">
                Spending by category
              </h3>
              {categories.length === 0 ? (
                <p className="text-sm text-brand-text-secondary">
                  No transactions in this period.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {categories.map((c) => (
                    <div
                      key={c.category}
                      className="flex items-center justify-between border-b border-brand-border-subtle pb-3 last:border-0"
                    >
                      <span className="flex items-center gap-2 text-sm text-brand-text">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: getTransactionCategoryColor(c.category) }}
                        />
                        {getTransactionCategoryLabel(c.category)}
                      </span>
                      <span className="text-sm font-semibold text-brand-text">
                        {formatMoney(c.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {chartMode === "avg" && (
            <>
              <h3 className="mb-4 font-semibold text-brand-text">
                Average spend per day
              </h3>
              <p className="text-3xl font-bold text-brand-text">
                {formatMoney(spent / days)}
              </p>
              <p className="mt-1 text-xs text-brand-text-secondary">
                Over the last {Math.round(days)} days
              </p>
            </>
          )}
        </div>

        {/* recent transactions */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-brand-text">
              Recent transactions
            </h3>
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
                      <p className="text-sm font-medium text-brand-text">
                        {label}
                      </p>
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
    </div>
  );
}
