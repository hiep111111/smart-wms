"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface Movement {
  id: string;
  type: string;
  quantity: number;
  createdAt: Date;
}

interface Props {
  data: Movement[];
}

export function MovementLineChart({ data }: Props) {
  const { t } = useLanguage();

  // Process data to map points. We'll show points sequentially.
  // We can group by common index or just display the last N movements.
  const chartData = [...data].reverse().map((m, idx) => ({
    name: `#${idx + 1}`,
    in: m.type === "IN" ? m.quantity : 0,
    out: m.type === "OUT" ? m.quantity : 0,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }}/>
          <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="IN" />
          <Line type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="OUT" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
