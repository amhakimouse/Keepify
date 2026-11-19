import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function TenureChurnChart({ data }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Churn par ancienneté (tenure)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <style id="area-gradient">{`.area-gradient-1 { stop-color: #f43f5e; stop-opacity: 0.8; } .area-gradient-2 { stop-color: #4f46e5; stop-opacity: 0.8; }`}</style>
              <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRetained" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            <Area type="monotone" dataKey="churn" stroke="#f43f5e" fillOpacity={1} name="Churn" />
            <Area type="monotone" dataKey="retained" stroke="#4f46e5" fillOpacity={1} name="Retenus" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}