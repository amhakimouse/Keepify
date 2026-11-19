import { useEffect, useState } from 'react'
import { admin, model } from '../services/api'

export default function AdminRetrain() {
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')

  const pull = () => model.retrainStatus().then((res) => setJob(res.data)).catch(() => {})

  useEffect(() => {
    pull()
  }, [])

  useEffect(() => {
    if (job?.status !== 'running') return undefined
    const timer = setInterval(pull, 2000)
    return () => clearInterval(timer)
  }, [job?.status])

  const launch = async () => {
    setError('')
    try {
      const res = await admin.retrain()
      setJob(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const scores = job?.result?.scores || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Modèles</p>
          <h2 className="mt-1 font-serif text-4xl">Entraînement</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Trois modèles sont réajustés : régression logistique, forêt aléatoire et XGBoost. Le meilleur score PR-AUC est enregistré et devient celui utilisé par les prédictions.
          </p>
        </div>
        <button className="btn-primary" onClick={launch} disabled={job?.status === 'running'}>
          {job?.status === 'running' ? 'Entraînement en cours…' : 'Relancer l’entraînement'}
        </button>
      </div>

      {error && <p className="text-sm text-clay">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Statut</p><p className="mt-3 font-serif text-3xl capitalize">{job?.status || '—'}</p></article>
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Déclencheur</p><p className="mt-3 font-serif text-3xl">{job?.trigger || '—'}</p></article>
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Modèle retenu</p><p className="mt-3 font-serif text-3xl">{job?.result?.best_model || job?.model_name || '—'}</p></article>
      </div>

      {job?.error && <p className="card text-sm text-clay">{job.error}</p>}

      {scores.length > 0 && (
        <section className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                {['Modèle', 'PR-AUC', 'Rappel', 'Précision', 'F1', 'ROC-AUC'].map((label) => (
                  <th key={label} className="px-5 py-3">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores.map((row) => (
                <tr key={row.model} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium">{row.model}</td>
                  <td className="px-5 py-3">{(row.pr_auc * 100).toFixed(1)} %</td>
                  <td className="px-5 py-3">{(row.recall * 100).toFixed(1)} %</td>
                  <td className="px-5 py-3">{(row.precision * 100).toFixed(1)} %</td>
                  <td className="px-5 py-3">{(row.f1 * 100).toFixed(1)} %</td>
                  <td className="px-5 py-3">{(row.roc_auc * 100).toFixed(1)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
