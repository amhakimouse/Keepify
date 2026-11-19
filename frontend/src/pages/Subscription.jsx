import { useEffect, useState } from 'react'
import { subscriptions, model } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const plans = [
  { name: 'Essentiel', text: 'Scores unitaires et historique personnel.' },
  { name: 'Équipe', text: 'Volume de prédictions plus élevé pour une équipe.' },
  { name: 'Direction', text: 'Pilotage, comparaison de modèles et réentraînement.' },
]

export default function Subscription() {
  const { user } = useAuth()
  const [subs, setSubs] = useState([])
  const [selected, setSelected] = useState('Équipe')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [job, setJob] = useState(null)

  const refresh = () => {
    subscriptions.list()
      .then((res) => setSubs((res.data || []).filter((item) => item.user_id === user?.id)))
      .catch(() => setSubs([]))
  }

  useEffect(() => {
    refresh()
  }, [user?.id])

  useEffect(() => {
    if (!job || job.status === 'success' || job.status === 'error' || job.status === 'idle') return undefined
    const timer = setInterval(() => {
      model.retrainStatus().then((res) => setJob(res.data)).catch(() => {})
    }, 2000)
    return () => clearInterval(timer)
  }, [job?.status])

  const createSub = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await subscriptions.create({ plan_name: selected, status: 'active' })
      const status = await model.retrainStatus()
      setJob(status.data)
      setMessage('Abonnement enregistré. L’entraînement du modèle a été lancé.')
      refresh()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Création impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Compte</p>
        <h2 className="mt-1 font-serif text-4xl">Abonnement</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Chaque nouvel abonnement déclenche un réentraînement. Le jeu étiqueté d’origine est conservé, et seuls les clients réellement nouveaux y sont ajoutés, pour éviter qu’une même fiche serve à la fois à l’apprentissage et au test.
        </p>
      </div>

      <form onSubmit={createSub} className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <button
            type="button"
            key={plan.name}
            onClick={() => setSelected(plan.name)}
            className={`card text-left ${selected === plan.name ? 'border-teal ring-2 ring-teal/20' : ''}`}
          >
            <p className="font-serif text-2xl">{plan.name}</p>
            <p className="mt-2 text-sm text-ink-muted">{plan.text}</p>
          </button>
        ))}
        <div className="lg:col-span-3">
          {error && <p className="mb-3 text-sm text-clay">{error}</p>}
          {message && <p className="mb-3 text-sm text-teal">{message}</p>}
          {job && (
            <p className="mb-3 text-sm text-ink-soft">
              Entraînement : {job.status}
              {job.result?.best_model ? ` · modèle retenu ${job.result.best_model}` : ''}
              {job.error ? ` · ${job.error}` : ''}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enregistrement…' : `Souscrire à ${selected}`}
          </button>
        </div>
      </form>

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Début</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr><td colSpan={3} className="px-5 py-8 text-ink-muted">Aucun abonnement pour le moment.</td></tr>
            ) : subs.map((item) => (
              <tr key={item.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-medium">{item.plan_name}</td>
                <td className="px-5 py-3">{item.status}</td>
                <td className="px-5 py-3 text-ink-muted">{item.started_at ? new Date(item.started_at).toLocaleDateString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
