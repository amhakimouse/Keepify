import { useEffect, useState } from 'react'
import { admin } from '../services/api'
import { BarChart3, Users, AlertCircle, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    admin.stats()
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <BarChart3 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  )

  if (!stats) return (
    <div className="bg-white rounded-3xl p-8 text-center">
      <p className="text-slate-500">Impossible de charger les statistiques</p>
    </div>
  )

  const churnRatePercent = (stats.churn_rate * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tableau de bord Admin</h2>
          <p className="text-slate-600">Vue globale du churn et de la rétention client</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total clients</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_customers}</p>
            </div>
            <Users className="w-10 h-10 text-indigo-100 bg-indigo-50 rounded-xl p-2 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Taux de churn</p>
              <p className="text-3xl font-bold text-rose-600 mt-1">{churnRatePercent}%</p>
            </div>
            <AlertCircle className="w-10 h-10 text-rose-100 bg-rose-50 rounded-xl p-2 text-rose-600" />
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Clients churners</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.churn_count}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-indigo-100 bg-indigo-50 rounded-xl p-2 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Churn par type de contrat</h3>
          <div className="space-y-3">
            {Object.entries(stats.churn_by_contract || {}).map(([contract, count]) => (
              <div key={contract} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{contract}</span>
                <span className="text-sm font-medium text-slate-900">{count} clients</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Churn par ancienneté</h3>
          <div className="space-y-3">
            {Object.entries(stats.tenure_churn || {}).map(([group, data]) => {
              const rate = data.total > 0 ? ((data.churn / data.total) * 100).toFixed(1) : 0
              return (
                <div key={group} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{group} mois</span>
                  <span className="text-sm font-medium text-slate-900">{rate}% churn</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Répartition des risques (prédictions)</h3>
        <div className="grid grid-cols-3 gap-4">
          {['Low', 'Medium', 'High'].map((level) => {
            const count = stats.risk_distribution?.[level] || 0
            const color = level === 'Low' ? 'emerald' : level === 'Medium' ? 'amber' : 'rose'
            return (
              <div key={level} className={`p-4 rounded-xl text-center border ${color}-100`}>
                <span className={`block text-xs font-semibold uppercase ${color}-600`}>{level}</span>
                <span className="text-2xl font-bold text-slate-900 mt-1">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Réentraînement du modèle</h3>
          <p className="text-sm text-slate-500">Lancez un nouvel entraînement avec les dernières données</p>
        </div>
        <button className="btn-primary">
          Réentraîner maintenant
        </button>
      </div>
    </div>
  )
}