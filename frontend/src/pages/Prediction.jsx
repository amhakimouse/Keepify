import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { predictions } from '../services/api'
import { ArrowRight, Clock } from 'lucide-react'

const fields = [
  { key: 'gender', label: 'Genre', type: 'select', options: ['Male', 'Female'] },
  { key: 'senior_citizen', label: 'Senior Citizen', type: 'select', options: [0, 1] },
  { key: 'partner', label: 'Partenaire', type: 'select', options: ['Yes', 'No'] },
  { key: 'dependents', label: 'Personnes à charge', type: 'select', options: ['Yes', 'No'] },
  { key: 'tenure_months', label: 'Ancienneté (mois)', type: 'number', placeholder: 'ex: 24' },
  { key: 'phone_service', label: 'Service téléphonique', type: 'select', options: ['Yes', 'No'] },
  { key: 'multiple_lines', label: 'Lignes multiples', type: 'select', options: ['Yes', 'No', 'No phone service'] },
  { key: 'internet_service', label: 'Service Internet', type: 'select', options: ['DSL', 'Fiber optic', 'No'] },
  { key: 'online_security', label: 'Sécurité en ligne', type: 'select', options: ['Yes', 'No', 'No internet service'] },
  { key: 'online_backup', label: 'Sauvegarde en ligne', type: 'select', options: ['Yes', 'No', 'No internet service'] },
  { key: 'device_protection', label: 'Protection appareil', type: 'select', options: ['Yes', 'No', 'No internet service'] },
  { key: 'tech_support', label: 'Support technique', type: 'select', options: ['Yes', 'No', 'No internet service'] },
  { key: 'streaming_tv', label: 'TV en streaming', type: 'select', options: ['Yes', 'No', 'No internet service'] },
  { key: 'streaming_movies', label: 'Films en streaming', type: 'select', options: ['Yes', 'No', 'No internet service'] },
  { key: 'contract', label: 'Type de contrat', type: 'select', options: ['Month-to-month', 'One year', 'Two year'] },
  { key: 'paperless_billing', label: 'Facture dématérialisée', type: 'select', options: ['Yes', 'No'] },
  { key: 'payment_method', label: 'Mode de paiement', type: 'select', options: ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'] },
  { key: 'monthly_charges', label: 'Charges mensuelles ($)', type: 'number', placeholder: 'ex: 70.50' },
  { key: 'total_charges', label: 'Charges totales ($)', type: 'number', placeholder: 'ex: 1500.00' },
]

export default function Prediction() {
  const navigate = useNavigate()
  const [form, setForm] = useState(Object.fromEntries(fields.map(f => [f.key, ''])))
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {}
      fields.forEach((field) => {
        const raw = form[field.key]
        if (raw === '' || raw === null || raw === undefined) return
        if (field.type === 'number' || field.key === 'senior_citizen') payload[field.key] = Number(raw)
        else payload[field.key] = raw
      })
      const res = await predictions.create(payload)
      setResult(res.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Erreur lors de la prédiction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <div>
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Score</p>
            <h2 className="mt-1 font-serif text-4xl text-ink">Prédiction de churn</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Le score est calculé par le modèle chargé en production, pas par une règle fixe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                {field.type === 'select' ? (
                  <select className="input-field" value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={field.type} className="input-field" value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} />
                )}
              </div>
            ))}
          </div>
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}{loading ? 'Analyse en cours...' : 'Lancer la prédiction'}
          </button>
        </form>
        {error && <p className="text-sm text-clay">{error}</p>}
      </div>
      <div>
        {result ? (
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-3xl">Résultat</h3>
                <p className="mt-1 text-sm text-ink-muted">Produit par {result.model_used}</p>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {result.risk_segment}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-paper p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Probabilité</p>
                <p className="kpi-value mt-2">{(result.churn_probability * 100).toFixed(1)} %</p>
              </div>
              <div className="rounded-lg bg-paper p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Décision</p>
                <p className="mt-3 text-lg font-semibold">{result.predicted_churn === 1 ? 'Départ probable' : 'Client retenu'}</p>
              </div>
            </div>
            <div className="mt-6 border-t border-line pt-5">
              <h4 className="text-sm font-semibold">Suite recommandée</h4>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {(result.predicted_churn === 1
                  ? ['Contacter le client sous 48 h avec une offre ciblée', 'Proposer un contrat annuel', 'Vérifier le support et la facturation']
                  : ['Maintenir le niveau de service actuel', 'Proposer un programme de parrainage', 'Recontrôler le compte au prochain cycle']
                ).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <button onClick={() => navigate('/predictions')} className="btn-secondary mt-6" type="button">
              Voir l'historique <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="card flex min-h-64 flex-col justify-center">
            <h3 className="font-serif text-3xl">En attente d'un dossier</h3>
            <p className="mt-2 max-w-sm text-sm text-ink-muted">
              Renseignez le profil à gauche. Le résultat affichera le nom du modèle réellement utilisé.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}