import {
  Area,
  AreaChart,
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
} from 'recharts'
import Card from '../common/Card.jsx'
import { formatCurrency } from '../../utils/helpers.js'

const chartColors = ['#ff7a00', '#22c55e']

const tooltipStyle = {
  background: '#111111',
  border: '1px solid rgb(255 255 255 / 0.12)',
  borderRadius: 14,
  color: '#f5f5f5',
}

function ChartShell({ title, hint, children, compact = false }) {
  return (
    <Card className="min-w-0 overflow-hidden p-3 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold text-nb-white sm:text-lg">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-4 text-nb-gray sm:text-xs">{hint}</p>
        </div>
      </div>
      <div className={compact ? 'h-52 min-w-0 sm:h-64' : 'h-56 min-w-0 sm:h-64'}>{children}</div>
    </Card>
  )
}

export default function AnalyticsCharts({ paymentMethods, bestSellers, weeklyOrders }) {
  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-2">
      <ChartShell title="Payment Methods" hint="Cash and online contribution" compact>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Pie data={paymentMethods} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="70%" paddingAngle={4}>
              {paymentMethods.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Best Selling Products" hint="Revenue by product family">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bestSellers} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#a0a0a0', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill: '#a0a0a0', fontSize: 10 }} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#ffc857" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Weekly Orders" hint="Order count by weekday">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyOrders} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="ordersGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.08)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#a0a0a0', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#a0a0a0', fontSize: 10 }} axisLine={false} tickLine={false} width={42} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="orders" name="Orders" stroke="#38bdf8" strokeWidth={3} fill="url(#ordersGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>
    </section>
  )
}
