import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ChurnByContractChart({ data }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Taux de churn par type de contrat</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#94a3b8" tickFontSize="12" axisLine={false} tick={{ fill: '#64748b' }} />
            <YAxis stroke="#94a3b8" tickFontSize="12" axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: '#64748b' }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              labelStyle={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              itemStyle={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }}
              separator=" : "
            />
            <Legend verticalAlign="top" align="right" height={36} fill="#64748b" />
            <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}