import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, BarChart3, CreditCard } from 'lucide-react'
import { predictions, subscriptions, model } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [plans, setPlans] = useState([])
  const [activeModel, setActiveModel] = useState('—')

  useEffect(() => {
    predictions.list().then((res) => setHistory(res.data || [])).catch(() => setHistory([]))
    subscriptions.list().then((res) => setPlans((res.data || []).filter((item) => item.user_id === user?.id))).catch(() => setPlans([]))
    model.info().then((res) => setActiveModel(res.data.model_name || '—')).catch(() => setActiveModel('—'))
  }, [user?.id])

  const high = history.filter((item) => item.risk_segment === 'High').length
  const actions = [
    { name: 'Nouvelle prédiction', path: '/predict', icon: Activity, text: 'Scorer un client avec le modèle en production' },
    { name: 'Historique', path: '/predictions', icon: BarChart3, text: 'Revoir les scores déjà produits' },
    { name: 'Abonnement', path: '/subscription', icon: CreditCard, text: 'Un nouvel abonnement relance l’entraînement' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Espace client</p>
        <h2 className="mt-1 font-serif text-4xl">Bonjour {user?.username}</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Les scores ci-dessous viennent du modèle <span className="font-semibold text-ink">{activeModel}</span>, chargé depuis le fichier entraîné.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Prédictions</p><p className="kpi-value mt-3">{history.length}</p></article>
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Risque élevé</p><p className="kpi-value mt-3">{high}</p></article>
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Abonnements</p><p className="kpi-value mt-3">{plans.length}</p></article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button key={action.path} onClick={() => navigate(action.path)} className="card text-left transition hover:-translate-y-0.5">
              <Icon className="h-5 w-5 text-teal" />
              <h3 className="mt-4 font-semibold">{action.name}</h3>
              <p className="mt-1 text-sm text-ink-muted">{action.text}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
