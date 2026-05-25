import { useFetch } from '../../hooks/useFetch.js'
import api from '../../services/api.js'
import Loader from '../../components/common/Loader.jsx'
import Card from '../../components/common/Card.jsx'
import SalesAreaChart from '../../components/dashboard/SalesAreaChart.jsx'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function Analytics() {
  const { data: sales, loading: l1, error: e1 } = useFetch(() => api.get('/api/analytics/sales', { params: { days: 30 } }).then((r) => r.data), [])
  const { data: traffic, loading: l2, error: e2 } = useFetch(() => api.get('/api/analytics/traffic').then((r) => r.data), [])

  if (l1 || l2) return <Loader label="Building analytics decks" />
  if (e1 || e2) return <Card className="text-nb-neon-red">{(e1 || e2).message}</Card>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-nb-white">Analytics</h1>
        <p className="text-sm text-nb-gray">Revenue curves, throughput, and marketing traffic baselines.</p>
      </div>
      <Card glow>
        <h2 className="font-heading text-lg font-bold text-nb-white">30-day revenue</h2>
        <SalesAreaChart data={sales.series} />
      </Card>
      <Card>
        <h2 className="font-heading text-lg font-bold text-nb-white">Traffic (stub)</h2>
        <p className="text-sm text-nb-gray">{traffic.message}</p>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={traffic.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: '#111111',
                  border: '1px solid rgb(255 255 255 / 0.12)',
                  borderRadius: 12,
                  color: '#f5f5f5',
                }}
              />
              <Bar dataKey="visits" fill="#ff7a00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
