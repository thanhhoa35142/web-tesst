"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  count: { label: "Events", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function EventsByDay({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  const rows = data.map((d) => ({
    day: new Date(d.day).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
    }),
    count: d.count,
  }));

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <AreaChart data={rows} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="eventsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--color-count)"
          fill="url(#eventsFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
