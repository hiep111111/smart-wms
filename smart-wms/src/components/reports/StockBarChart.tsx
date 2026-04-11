"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Props {
  data: { name: string; quantity: number }[];
}

export function StockBarChart({ data }: Props) {
  const { t } = useLanguage();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.length > 10 ? `${value.substring(0,10)}...` : value}
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
          />
          <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t("kpi.totalStock") || "Stock"} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
