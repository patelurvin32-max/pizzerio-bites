import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function OrdersBarChart({ data }) {
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.08)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: '#111111',
              border: '1px solid rgb(255 255 255 / 0.12)',
              borderRadius: 12,
              color: '#f5f5f5',
            }}
          />
          <Bar dataKey="orders" fill="#ffc857" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
