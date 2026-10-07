"use client";

import {
  Area,
  AreaChart,
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

import { formatMoney, type CategoryPoint, type MonthlyPoint } from "@/lib/types";

/* ---------- tooltip styling reused by both charts ---------- */
const tooltipStyles = {
  contentStyle: {
    backgroundColor: "#0f1910",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontSize: "12px",
  },
  labelStyle: { color: "#9ca3af" },
  itemStyle: { color: "#fff" },
};

/* ---------- monthly trend (spend vs income) ---------- */
export function MonthlyTrendChart({
  data,
  currency,
}: {
  data: MonthlyPoint[];
  currency: string;
}) {
  if (data.length === 0) {
    return <EmptyState message="No monthly data yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
            return v;
          }}
        />
        <Tooltip
          {...tooltipStyles}
          formatter={(v) => formatMoney(Number(v) || 0, currency)}
        />
        <Area
          type="monotone"
          dataKey="total_spent"
          name="Spent"
          stroke="#22c55e"
          fill="url(#spendGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="total_income"
          name="Income"
          stroke="#10b981"
          fill="url(#incomeGrad)"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------- category breakdown (donut) ---------- */
const PIE_COLORS = [
  "#22c55e", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#f59e0b", "#ef4444", "#06b6d4",
  "#84cc16", "#a855f7", "#14b8a6", "#f97316",
];

export function CategoryPieChart({
  data,
  currency,
}: {
  data: CategoryPoint[];
  currency: string;
}) {
  if (data.length === 0) {
    return <EmptyState message="No expenses yet" />;
  }

  const chartData = data.slice(0, 8);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="category"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            {...tooltipStyles}
            formatter={(v) => formatMoney(Number(v) || 0, currency)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 text-sm">
        {chartData.map((c, i) => (
          <div key={c.category} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-gray-300 truncate">{c.category}</span>
            </div>
            <span className="text-white font-medium flex-shrink-0">
              {formatMoney(c.total, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- small horizontal bar (optional) ---------- */
export function CategoryBarChart({
  data,
  currency,
}: {
  data: CategoryPoint[];
  currency: string;
}) {
  if (data.length === 0) return <EmptyState message="No data" />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip
          {...tooltipStyles}
          formatter={(v) => formatMoney(Number(v) || 0, currency)}
        />
        <Bar dataKey="total" fill="#22c55e" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
      {message}
    </div>
  );
}
