import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getRiskColor } from '../utils/chartUtils'

const COLORS = ['#10b981', '#f59e0b', '#f43f5e']

export default function RiskDistributionChart({ data }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Répartition des risques (prédictions)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }}
              labelStyle={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              itemStyle={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }}
              separator=" : "
            />
            <Pie
              dataKey="value"
              isAnimationActive={false}
              innerRadius={80}
              outerRadius={90}
              paddingAngle={5}
              labelLine={false}
              label={{ position: 'outside', fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {data.map((entry, index) => {
          const color = getRiskColor(entry.name)
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${color.dot}`} />
              <span className="text-sm font-medium text-slate-700">{entry.name}</span>
              <span className="text-sm font-medium text-slate-900">{entry.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}