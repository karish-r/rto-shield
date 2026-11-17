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
} from 'recharts';

interface PerformanceItem {
  name: string;
  count: number;
}

interface PaymentSplitItem {
  name: string;
  value: number;
  amount: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e5e5',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#0a0a0a',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

export function OrderPerformanceChart({ data }: { data: PerformanceItem[] }) {
  const barColors: Record<string, string> = {
    Delivered: '#171717',
    RTO: '#737373',
    Cancelled: '#d4d4d4',
  };

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#525252', fontSize: 12 }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#737373', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            formatter={(value) => [`${value} orders`, 'Count']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={barColors[entry.name] || '#171717'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CodVsPrepaidChart({ data }: { data: PaymentSplitItem[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#0a0a0a', '#a3a3a3'];

  if (total === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-neutral-500">
        No order payment data available.
      </div>
    );
  }

  return (
    <div className="flex h-60 flex-col items-center justify-between sm:flex-row sm:gap-4">
      <div className="h-44 w-full sm:h-52 sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={70}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((entry, idx) => (
                <Cell key={entry.name} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${value} orders`, 'Volume']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full space-y-3 sm:w-1/2">
        {data.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div
              key={item.name}
              className="flex items-center justify-between border-b border-neutral-100 pb-2.5 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <div>
                  <div className="text-xs font-semibold text-neutral-950">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 tabular-nums">
                    ₹{item.amount.toLocaleString('en-IN')} total value
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-xs tabular-nums">
                <div className="font-semibold text-neutral-950">{pct}%</div>
                <div className="text-[11px] text-neutral-500">
                  {item.value} orders
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
