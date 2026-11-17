import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e5e5',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#0a0a0a',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

export function ReportDeliveredVsRtoChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const fills: Record<string, string> = {
    Delivered: '#0a0a0a',
    RTO: '#737373',
    'In Transit': '#d4d4d4',
    Cancelled: '#e5e5e5',
  };

  return (
    <div className="h-64 w-full">
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={54}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={fills[entry.name] || '#171717'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportCodVsPrepaidChart({
  data,
}: {
  data: { name: string; count: number; value: number }[];
}) {
  const colors = ['#0a0a0a', '#a3a3a3'];
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-neutral-500">
        No orders in this date range.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius={48}
            outerRadius={78}
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
            formatter={(value, name) => [`${value} orders`, String(name)]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="square"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportMonthlyTrendsChart({
  data,
}: {
  data: { month: string; total: number; delivered: number; rto: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
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
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total Orders"
            stroke="#0a0a0a"
            strokeWidth={2}
            dot={{ r: 3, fill: '#0a0a0a' }}
          />
          <Line
            type="monotone"
            dataKey="delivered"
            name="Delivered"
            stroke="#525252"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: '#525252' }}
          />
          <Line
            type="monotone"
            dataKey="rto"
            name="RTO"
            stroke="#a3a3a3"
            strokeWidth={2}
            dot={{ r: 3, fill: '#a3a3a3' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportAttentionDistributionChart({
  data,
}: {
  data: { level: string; count: number }[];
}) {
  const colors: Record<string, string> = {
    Low: '#d4d4d4',
    Medium: '#737373',
    High: '#0a0a0a',
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="level"
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
            formatter={(value) => [`${value} orders`, 'Orders']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {data.map((entry) => (
              <Cell key={entry.level} fill={colors[entry.level] || '#171717'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
