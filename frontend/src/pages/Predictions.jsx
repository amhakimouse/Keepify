import { useEffect, useState } from 'react'
import { predictions } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function PredictionsPage() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    predictions.list()
      .then((res) => setList(res.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-ink-muted">Chargement de l'historique…</p>

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Suivi</p>
        <h2 className="mt-1 font-serif text-4xl text-ink">Historique des prédictions</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {user?.role === 'admin' ? 'Toutes les prédictions du système' : 'Vos prédictions personnelles'}
        </p>
      </div>

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              {['Date', 'Probabilité', 'Risque', 'Décision', 'Modèle'].map((label) => (
                <th key={label} className="px-5 py-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-ink-muted">Aucune prédiction pour le moment.</td></tr>
            ) : list.map((item) => (
              <tr key={item.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 text-ink-soft">{new Date(item.created_at).toLocaleString('fr-FR')}</td>
                <td className="px-5 py-3 font-semibold">{((item.churn_probability || 0) * 100).toFixed(1)} %</td>
                <td className="px-5 py-3">{item.risk_segment}</td>
                <td className="px-5 py-3">{item.predicted_churn === 1 ? 'Départ' : 'Rétention'}</td>
                <td className="px-5 py-3 text-teal">{item.model_used}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
