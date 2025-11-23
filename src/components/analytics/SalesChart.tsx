import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';

interface SalesDataPoint {
  date: string;
  revenue: number;
  sales: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  className?: string;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, className }) => {
  return (
    <div className={`w-full h-64 md:h-80 ${className ?? ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          {/* Dual Y axes: left for revenue ($), right for sales count */}
          <YAxis yAxisId="left" tickFormatter={(v) => `$${Number(v).toFixed(0)}`} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${Number(v).toFixed(0)}`} />
          <Tooltip
            formatter={(value, name) => {
              const n = String(name);
              if (n.toLowerCase().includes('revenue')) {
                return [`$${Number(value as number).toFixed(2)}`, 'Revenue'];
              }
              if (n.toLowerCase().includes('sales')) {
                return [Number(value as number), 'Sales'];
              }
              return [value as any, name as any];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="sales"
            name="Sales Count"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
