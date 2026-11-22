import { useEffect, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { admin } from '../services/api'
import ComparativeExperiments from '../components/ComparativeExperiments'

const tooltipStyle = {
  background: '#fffcf8',
  border: '1px solid #e4dfd4',
  borderRadius: 10,
  fontSize: 12,
  color: '#16181d',
}

const PIE = ['#0f5f5b', '#c4a15a', '#9a3b24', '#8d93a0']

function ChartCard({ title, hint, children }) {
  return (
    <section className="card">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      <div className="mt-4 h-72">{children}</div>
    </section>
  )
}

export default function AdminStats() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    admin.stats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Impossible de charger le pilotage'))
  }, [])

  if (error) {
    return <div className="card text-sm text-clay">{error}</div>
  }
  if (!stats) {
    return <p className="text-sm text-ink-muted">Chargement du portefeuille…</p>
  }

  const riskData = ['Low', 'Medium', 'High'].map((name) => ({
    name,
    value: stats.risk_distribution?.[name] || 0,
  }))
  const modelData = (stats.model_comparison || []).map((row) => ({
    name: row.model,
    pr_auc: Math.round((row.pr_auc || 0) * 1000) / 10,
    recall: Math.round((row.recall || 0) * 1000) / 10,
    roc_auc: Math.round((row.roc_auc || 0) * 1000) / 10,
  }))
  const headers = stats.correlation?.headers || []
  const matrix = stats.correlation?.matrix || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Direction</p>
          <h2 className="mt-1 font-serif text-4xl text-ink">Pilotage du churn</h2>
        </div>
        <div className="rounded-full border border-line bg-paper-card px-4 py-2 text-sm">
          Modèle en production <span className="font-semibold text-teal">{stats.active_model}</span>
        </div>
      </div>

      {/* Visualisations et Interprétations des Expérimentations au TOP du site */}
      <ComparativeExperiments />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Clients suivis', stats.total_customers.toLocaleString('fr-FR')],
          ['Taux de churn', `${(stats.churn_rate * 100).toFixed(1)} %`],
          ['Résiliations', stats.churn_count.toLocaleString('fr-FR')],
          ['Prédictions', stats.prediction_count.toLocaleString('fr-FR')],
        ].map(([label, value]) => (
          <article key={label} className="card">
            <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">{label}</p>
            <p className="kpi-value mt-3">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Churn par ancienneté" hint="Part des clients partis dans chaque tranche de tenure.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.tenure_series || []}>
              <CartesianGrid stroke="#e4dfd4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6d7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6d7280', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="rate" name="Taux de churn" stroke="#9a3b24" fill="#9a3b24" fillOpacity={0.18} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Churn par contrat" hint="Les contrats mois par mois concentrent le risque.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.contract_series || []}>
              <CartesianGrid stroke="#e4dfd4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6d7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6d7280', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="rate" name="Taux de churn" fill="#0f5f5b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mode de paiement" hint="Taux de départ selon le moyen de règlement.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.payment_series || []} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="#e4dfd4" horizontal={false} />
              <XAxis type="number" unit="%" tick={{ fill: '#6d7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#6d7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="rate" name="Taux de churn" fill="#8a5a12" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Service internet et facture" hint="Fibre, DSL et niveau de charge mensuelle.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...(stats.internet_series || []), ...(stats.charges_series || [])]}>
              <CartesianGrid stroke="#e4dfd4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6d7280', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-18} height={56} textAnchor="end" />
              <YAxis tick={{ fill: '#6d7280', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="rate" name="Taux de churn" fill="#3a3f4b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <section className="card xl:col-span-2">
          <h3 className="text-base font-semibold">Risque des prédictions</h3>
          <p className="mt-1 text-sm text-ink-muted">Décisions déjà produites par le modèle en service.</p>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3}>
                  {riskData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE[index % PIE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card xl:col-span-3">
          <h3 className="text-base font-semibold">Comparaison des modèles</h3>
          <p className="mt-1 text-sm text-ink-muted">PR-AUC, rappel et ROC-AUC. Le modèle retenu est {stats.active_model}.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelData}>
                <CartesianGrid stroke="#e4dfd4" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6d7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6d7280', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="pr_auc" name="PR-AUC" fill="#0f5f5b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recall" name="Rappel" fill="#8a5a12" radius={[4, 4, 0, 0]} />
                <Bar dataKey="roc_auc" name="ROC-AUC" fill="#3a3f4b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {headers.length > 0 && (
        <section className="card overflow-x-auto">
          <h3 className="text-base font-semibold">Corrélation des signaux numériques</h3>
          <p className="mt-1 mb-4 text-sm text-ink-muted">Ancienneté, facture mensuelle, facture totale et churn observé.</p>
          <table className="w-full min-w-[420px] text-center text-sm">
            <thead>
              <tr>
                <th className="p-2" />
                {headers.map((header) => (
                  <th key={header} className="p-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIndex) => (
                <tr key={headers[rowIndex]}>
                  <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">{headers[rowIndex]}</th>
                  {row.map((value, columnIndex) => {
                    const amount = Number(value) || 0
                    const alpha = Math.min(Math.abs(amount), 1) * 0.55
                    const color = amount >= 0 ? `rgba(15,95,91,${alpha})` : `rgba(154,59,36,${alpha})`
                    return (
                      <td key={columnIndex} className="p-2 font-medium" style={{ background: color }}>
                        {amount.toFixed(2)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Comptes</p><p className="kpi-value mt-3">{stats.user_count}</p></article>
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Abonnements</p><p className="kpi-value mt-3">{stats.subscription_count}</p></article>
        <article className="card"><p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Genre, taux max</p><p className="kpi-value mt-3">{stats.gender_series?.[0] ? `${stats.gender_series[0].rate} %` : '—'}</p></article>
      </div>
    </div>
  )
}
