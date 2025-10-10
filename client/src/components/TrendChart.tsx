import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface TrendChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  optimalMin: number;
  optimalMax: number;
  unit: string;
  color?: string;
}

export function TrendChart({ 
  title, 
  data, 
  optimalMin, 
  optimalMax, 
  unit,
  color = "hsl(var(--chart-1))"
}: TrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{ value: unit, angle: -90, position: 'insideLeft', style: { fill: "hsl(var(--muted-foreground))" } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
            />
            <ReferenceLine 
              y={optimalMin} 
              stroke="hsl(var(--chart-3))" 
              strokeDasharray="3 3" 
              opacity={0.5}
            />
            <ReferenceLine 
              y={optimalMax} 
              stroke="hsl(var(--chart-3))" 
              strokeDasharray="3 3" 
              opacity={0.5}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
