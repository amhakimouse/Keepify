import { heatMapColors } from '../utils/chartUtils'

export default function CorrelationHeatmap({ data }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Heatmap de corrélation globale</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase border-r border-slate-200">–</th>
              {data.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase border-r border-slate-200 rotate-[-45deg]">
                  <div className="flex items-end justify-end h-16">
                    {h}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-3 py-2 text-xs font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">
                  {data.headers[i]}
                </td>
                {row.map((val, j) => (
                  <td
                    key={j}
                    className="px-3 py-2 text-xs font-medium border-r border-slate-100"
                    style={{
                      backgroundColor: heatMapColors(val),
                      color: Math.abs(val) > 0.5 ? '#ffffff' : '#64748b',
                    }}
                  >
                    {val.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}