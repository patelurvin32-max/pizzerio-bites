import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function SalesAreaChart({ data }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="nbFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7a00" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#ff3b30" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.08)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            contentStyle={{
              background: '#111111',
              border: '1px solid rgb(255 255 255 / 0.12)',
              borderRadius: 12,
              color: '#f5f5f5',
            }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#ff7a00" strokeWidth={2} fill="url(#nbFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
