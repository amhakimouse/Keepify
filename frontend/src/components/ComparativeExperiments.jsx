import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend
} from 'recharts'
import {
  TrendingUp, DollarSign, Award, AlertTriangle, ShieldCheck, Layers,
  Sliders, Info, CheckCircle2, Zap, ArrowUpRight, Database
} from 'lucide-react'
import benchmarksData from '../data/benchmarksData.json'

const tooltipStyle = {
  background: '#fffcf8',
  border: '1px solid #e4dfd4',
  borderRadius: 10,
  fontSize: 12,
  color: '#16181d',
  boxShadow: '0 4px 12px rgba(22,24,29,0.06)',
}

export default function ComparativeExperiments() {
  const [activeTab, setActiveTab] = useState('roi')

  const { roi_curve, roi_summary, ablation, outliers, nans, noise } = benchmarksData

  // 1. ROI Data
  const roiChartData = (roi_curve || []).map((row) => ({
    threshold: Math.round(row.Threshold * 100) / 100,
    savings: Math.round(row.Net_Savings),
    tp: row.TP,
    fp: row.FP,
    recall: Math.round(row.Recall * 1000) / 10,
    precision: Math.round(row.Precision * 1000) / 10,
  }))

  // 2. Ablation Data
  const ablationChartData = (ablation || []).map((row) => ({
    scenario: row.Scenario.replace(' (#1 Lifecycle Anchor)', '').replace(' (#1 Categorical)', '').replace(' (Trivial)', '').replace(' (Baseline)', ''),
    delta_pr: Math.round(row['Δ PR-AUC'] * 10000) / 100,
    delta_f1: Math.round(row['Δ F1-Score'] * 10000) / 100,
    pr_auc: Math.round(row['PR-AUC'] * 1000) / 10,
    full_name: row.Scenario,
    dropped: row['Dropped Features'],
  }))

  // 3. Outliers Data
  const outlierChartData = [
    {
      model: 'Logistic Reg.',
      Normal: Math.round((outliers.find(r => r.Model === 'Logistic Regression' && r.Condition === 'Normal')?.['ROC-AUC'] || 0) * 1000) / 10,
      Outliers: Math.round((outliers.find(r => r.Model === 'Logistic Regression' && r.Condition === 'Experiment')?.['ROC-AUC'] || 0) * 1000) / 10,
      delta: -3.58,
    },
    {
      model: 'Random Forest',
      Normal: Math.round((outliers.find(r => r.Model === 'Random Forest' && r.Condition === 'Normal')?.['ROC-AUC'] || 0) * 1000) / 10,
      Outliers: Math.round((outliers.find(r => r.Model === 'Random Forest' && r.Condition === 'Experiment')?.['ROC-AUC'] || 0) * 1000) / 10,
      delta: +0.07,
    },
    {
      model: 'XGBoost',
      Normal: Math.round((outliers.find(r => r.Model === 'XGBoost' && r.Condition === 'Normal')?.['ROC-AUC'] || 0) * 1000) / 10,
      Outliers: Math.round((outliers.find(r => r.Model === 'XGBoost' && r.Condition === 'Experiment')?.['ROC-AUC'] || 0) * 1000) / 10,
      delta: -0.06,
    },
  ]

  // 4. NaNs Data
  const nansChartData = [
    {
      model: 'Logistic Reg.',
      Normal: Math.round((nans.find(r => r.Model === 'Logistic Regression' && r.Condition === 'Normal')?.['PR-AUC'] || 0) * 1000) / 10,
      NaNs_15: Math.round((nans.find(r => r.Model === 'Logistic Regression' && r.Condition === 'Experiment')?.['PR-AUC'] || 0) * 1000) / 10,
      delta: -3.49,
    },
    {
      model: 'Random Forest',
      Normal: Math.round((nans.find(r => r.Model === 'Random Forest' && r.Condition === 'Normal')?.['PR-AUC'] || 0) * 1000) / 10,
      NaNs_15: Math.round((nans.find(r => r.Model === 'Random Forest' && r.Condition === 'Experiment')?.['PR-AUC'] || 0) * 1000) / 10,
      delta: -4.45,
    },
    {
      model: 'XGBoost',
      Normal: Math.round((nans.find(r => r.Model === 'XGBoost' && r.Condition === 'Normal')?.['PR-AUC'] || 0) * 1000) / 10,
      NaNs_15: Math.round((nans.find(r => r.Model === 'XGBoost' && r.Condition === 'Experiment')?.['PR-AUC'] || 0) * 1000) / 10,
      delta: -4.43,
    },
  ]

  // 5. Noise Data
  const noiseChartData = [
    {
      model: 'Logistic Reg.',
      Normal: Math.round((noise.find(r => r.Model === 'Logistic Regression' && r.Condition === 'Normal')?.['PR-AUC'] || 0) * 1000) / 10,
      WithNoise: Math.round((noise.find(r => r.Model === 'Logistic Regression' && r.Condition === 'With 3 Noise Features')?.['PR-AUC'] || 0) * 1000) / 10,
    },
    {
      model: 'Random Forest',
      Normal: Math.round((noise.find(r => r.Model === 'Random Forest' && r.Condition === 'Normal')?.['PR-AUC'] || 0) * 1000) / 10,
      WithNoise: Math.round((noise.find(r => r.Model === 'Random Forest' && r.Condition === 'With 3 Noise Features')?.['PR-AUC'] || 0) * 1000) / 10,
    },
    {
      model: 'XGBoost',
      Normal: Math.round((noise.find(r => r.Model === 'XGBoost' && r.Condition === 'Normal')?.['PR-AUC'] || 0) * 1000) / 10,
      WithNoise: Math.round((noise.find(r => r.Model === 'XGBoost' && r.Condition === 'With 3 Noise Features')?.['PR-AUC'] || 0) * 1000) / 10,
    },
  ]

  const tabs = [
    { id: 'roi', label: 'ROI Financier & Seuil T*', icon: DollarSign, badge: 'Gain +9.2%' },
    { id: 'ablation', label: 'Ablation des Variables', icon: Layers, badge: 'Impact Tenure' },
    { id: 'outliers', label: 'Stress-Test Outliers', icon: Zap, badge: 'Modèles Arbres' },
    { id: 'nans', label: 'Test NaNs (15%)', icon: AlertTriangle, badge: 'Imputation' },
    { id: 'noise', label: 'Bruit & Robustesse', icon: ShieldCheck, badge: 'Sécurité' },
  ]

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-paper-card p-6 shadow-card transition-all">
      {/* Top Banner Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal">
            <Award className="h-3.5 w-3.5" />
            R&D Benchmarks & Études Comparatives
          </div>
          <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Visualisations & Interprétations Expérimentales
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-ink-muted sm:text-sm">
            Benchmarks rigoureux réalisés sur les données réelles Telco : optimisation du ROI de rétention, sensibilité des variables et tests de stress en production.
          </p>
        </div>

        {/* Quick Highlights Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2 text-xs text-ink-soft">
          <TrendingUp className="h-4 w-4 text-teal" />
          <span>Seuil Optimal Actif : <strong className="font-semibold text-teal">T* = 0,29</strong> (vs 0,50)</span>
        </div>
      </div>

      {/* 4 Summary Highlight Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-paper/60 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Économies Nettes Optimales</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-teal">65 000 $</span>
            <span className="text-xs font-medium text-teal flex items-center"><ArrowUpRight className="h-3 w-3" /> +5 450 $ (+9,2 %)</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Obtenu avec T* = 0,29 (vs 59 550 $ à T = 0,50)</p>
        </div>

        <div className="rounded-xl border border-line bg-paper/60 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Clients Churn Secourus</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-ink">347 / 374</span>
            <span className="text-xs font-medium text-teal">+53 clients</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Taux de rappel bondit de 78,6 % à 92,8 %</p>
        </div>

        <div className="rounded-xl border border-line bg-paper/60 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Pilier N°1 du Modèle</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-clay">Tenure Months</span>
            <span className="text-xs font-semibold text-clay">-0,068 PR</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Ancre de cycle de vie indispensable</p>
        </div>

        <div className="rounded-xl border border-line bg-paper/60 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Résilience aux Outliers</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-teal">XGBoost & RF</span>
            <span className="text-xs font-semibold text-teal">Δ = 0.00</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Invariance d'échelle vs dérive linéaire</p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                active
                  ? 'bg-teal text-white shadow-sm'
                  : 'border border-line bg-paper text-ink-soft hover:bg-paper-card hover:text-ink'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-line/70 text-ink-muted'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab 1: Financial ROI & Optimal Threshold */}
      {activeTab === 'roi' && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Chart Panel */}
          <div className="rounded-xl border border-line bg-paper p-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Courbe de Rentabilité Nette ($) selon le Seuil</h3>
                <p className="text-xs text-ink-muted">Balayage exhaustif des seuils de décision T ∈ [0.05, 0.95]</p>
              </div>
              <span className="rounded-md border border-line bg-paper-card px-2 py-1 text-[11px] font-medium text-ink">
                Max : <strong className="text-teal">65 000 $ à T* = 0,29</strong>
              </span>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f5f5b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0f5f5b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e4dfd4" vertical={false} />
                  <XAxis
                    dataKey="threshold"
                    tick={{ fill: '#6d7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit=" T"
                  />
                  <YAxis
                    tick={{ fill: '#6d7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k$`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val, name) => [
                      name === 'savings' ? `${val.toLocaleString()} $` : `${val}%`,
                      name === 'savings' ? 'Gain Net' : name
                    ]}
                    labelFormatter={(label) => `Seuil de décision T = ${label}`}
                  />
                  <ReferenceLine
                    x={0.5}
                    stroke="#9a3b24"
                    strokeDasharray="4 4"
                    label={{ value: 'Défaut T=0.50 (59.5k$)', position: 'insideTopLeft', fill: '#9a3b24', fontSize: 11 }}
                  />
                  <ReferenceLine
                    x={0.29}
                    stroke="#0f5f5b"
                    strokeWidth={2}
                    label={{ value: 'Optimal T*=0.29 (65k$)', position: 'insideTopRight', fill: '#0f5f5b', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    name="savings"
                    stroke="#0f5f5b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#roiGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-muted">
              L'aire verte représente le profit net d'entreprise après déduction des coûts d'intervention marketing.
            </p>
          </div>

          {/* Colleague's Interpretation & Comparative Table */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-line bg-paper/50 p-4 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
                <Info className="h-4 w-4" />
                Interprétation & Décision Financière
              </div>
              <h4 className="mt-1 font-serif text-lg font-bold text-ink">
                Seuil Arbitraire (0,50) vs Seuil Économique (0,29)
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                La formule de rentabilité d'entreprise calibrée par notre collègue s'énonce :
                <code className="mx-1 rounded bg-paper-card px-1.5 py-0.5 font-mono text-[11px] font-semibold text-teal border border-line">
                  Net = (TP × 250 $) - (FP × 50 $)
                </code>.
                Un churner conservé rapporte <strong>250 $</strong>, tandis qu'une offre adressée à tort (faux positif) ne coûte que <strong>50 $</strong>.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Le ratio économique (1:5) commande d'être proactif. En abaissant le seuil à <strong>T* = 0,29</strong>, on accepte davantage de contacts pour rattraper <strong>53 clients de plus</strong>, dégageant <strong>+5 450 $</strong> nets supplémentaires !
              </p>
            </div>

            {/* Comparison Side-by-Side Table */}
            <div className="rounded-lg border border-line bg-paper-card p-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-muted">
                    <th className="pb-1.5">Métrique</th>
                    <th className="pb-1.5 text-center">Défaut (0.50)</th>
                    <th className="pb-1.5 text-right font-bold text-teal">Optimal (0.29)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  <tr>
                    <td className="py-1 text-ink-soft">Clients Détectés (TP)</td>
                    <td className="py-1 text-center font-medium">294</td>
                    <td className="py-1 text-right font-bold text-teal">347 (+18 %)</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-ink-soft">Taux de Rappel</td>
                    <td className="py-1 text-center font-medium">78,6 %</td>
                    <td className="py-1 text-right font-bold text-teal">92,8 %</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-ink-soft">Précision</td>
                    <td className="py-1 text-center font-medium">51,3 %</td>
                    <td className="py-1 text-right font-medium">44,4 %</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-ink-soft">Chiffre d'Affaires Sauvé</td>
                    <td className="py-1 text-center font-medium">73 500 $</td>
                    <td className="py-1 text-right font-bold text-teal">86 750 $</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-ink-soft">Coût Campagne (FP)</td>
                    <td className="py-1 text-center font-medium">13 950 $</td>
                    <td className="py-1 text-right font-medium text-clay">21 750 $</td>
                  </tr>
                  <tr className="bg-teal-soft/40 font-bold">
                    <td className="py-1.5 text-teal">Profit Net Sauvé</td>
                    <td className="py-1.5 text-center text-ink">59 550 $</td>
                    <td className="py-1.5 text-right text-teal">65 000 $ (+9,2 %)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-teal-soft p-2.5 text-xs text-teal">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span><strong>Action Déployée :</strong> Le modèle en service utilise automatiquement ce seuil calibré de 0,29.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Feature Ablation Study */}
      {activeTab === 'ablation' && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Chart Panel */}
          <div className="rounded-xl border border-line bg-paper p-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Impact de l'Ablation des Groupes de Variables (Δ PR-AUC)</h3>
                <p className="text-xs text-ink-muted">Chute de performance relative par rapport au modèle complet (Baseline PR-AUC: 0.6434)</p>
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ablationChartData} layout="vertical" margin={{ left: 35, right: 20 }}>
                  <CartesianGrid stroke="#e4dfd4" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#6d7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit=" pts"
                  />
                  <YAxis
                    type="category"
                    dataKey="scenario"
                    tick={{ fill: '#16181d', fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val) => [`${val > 0 ? '+' : ''}${val} pts de PR-AUC`, 'Impact (Δ PR-AUC)']}
                  />
                  <Bar dataKey="delta_pr" name="Δ PR-AUC" radius={[0, 4, 4, 0]}>
                    {ablationChartData.map((entry) => (
                      <Cell
                        key={entry.scenario}
                        fill={entry.delta_pr < -2.0 ? '#9a3b24' : entry.delta_pr < 0 ? '#8a5a12' : '#0f5f5b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-clay" /> Perte Critique (&gt; 2 pts)</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-gold" /> Perte Modérée</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-teal" /> Gain / Neutre</span>
            </div>
          </div>

          {/* Colleague's Interpretation */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-line bg-paper/50 p-4 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
                <Layers className="h-4 w-4" />
                Interprétation des Drivers & Règles Métier
              </div>
              <h4 className="mt-1 font-serif text-lg font-bold text-ink">
                Hiérarchie des Signaux Prédictifs
              </h4>
              <div className="mt-3 space-y-2.5 text-xs text-ink-soft">
                <div className="rounded-lg border border-clay/30 bg-clay/5 p-2.5">
                  <p className="font-semibold text-clay">1. Tenure Months (Ancienneté) — IRREMPLAÇABLE</p>
                  <p className="mt-0.5 text-ink-muted leading-relaxed">
                    La suppression de l'ancienneté provoque un effondrement massif de <strong>-0,0682 de PR-AUC</strong> (-10,6 %). C'est l'ancre majeure du cycle de vie client qui ne doit jamais être écartée.
                  </p>
                </div>

                <div className="rounded-lg border border-line bg-paper-card p-2.5">
                  <p className="font-semibold text-gold">2. Contract (Type de Contrat) — CRITIQUE</p>
                  <p className="mt-0.5 text-ink-muted leading-relaxed">
                    Retirer le contrat induit une baisse de <strong>-0,0058 de PR-AUC</strong>. Les abonnements mois-par-mois portent l'essentiel du risque de résiliation.
                  </p>
                </div>

                <div className="rounded-lg border border-teal/30 bg-teal-soft/40 p-2.5">
                  <p className="font-semibold text-teal">3. Données Démographiques (Gender & Phone) — TRIVIALES</p>
                  <p className="mt-0.5 text-ink-muted leading-relaxed">
                    Leur suppression <strong>améliore légèrement le score (+0,0102)</strong>. Ces variables ajoutent du bruit inutile : elles peuvent être retirées pour accélérer l'API et sécuriser la conformité RGPD.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-paper-card p-2.5 text-[11px] text-ink-muted">
              <strong>Règle d'assurance qualité CI/CD :</strong> Tout modèle candidat en réentraînement doit conserver au minimum 95 % du PR-AUC de référence (seuil gate = 0,6112).
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Outliers Stress Test */}
      {activeTab === 'outliers' && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Chart Panel */}
          <div className="rounded-xl border border-line bg-paper p-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Impact des Valeurs Extrêmes de Facturation (ROC-AUC en %)</h3>
                <p className="text-xs text-ink-muted">Injection de 5 % d'outliers extrêmes (10 000 $ à 25 000 $) sur les factures mensuelles</p>
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outlierChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#e4dfd4" vertical={false} />
                  <XAxis dataKey="model" tick={{ fill: '#16181d', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[75, 90]} tick={{ fill: '#6d7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Normal" name="Normal (Baseline)" fill="#0f5f5b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Outliers" name="Avec 5% Outliers" fill="#9a3b24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-muted">
              Comparaison de la résistance des modèles : seul le modèle linéaire subit un décrochage visible.
            </p>
          </div>

          {/* Colleague's Interpretation */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-line bg-paper/50 p-4 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
                <Zap className="h-4 w-4" />
                Interprétation : Dérive de Calibration
              </div>
              <h4 className="mt-1 font-serif text-lg font-bold text-ink">
                Modèles Linéaires vs Arbres Décisionnels
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                L'expérience de notre collègue démontre une divergence architecturale fondamentale face aux anomalies numériques :
              </p>
              <ul className="mt-3 space-y-2 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-clay shrink-0" />
                  <span><strong>Régression Logistique :</strong> Dérive sévère de calibration (ROC-AUC chute de <strong>84,6 % à 81,0 %</strong>, rappel -3,5 pts). L'effet de levier des valeurs extrêmes déforme la frontière linéaire de décision.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal shrink-0" />
                  <span><strong>XGBoost & Random Forest :</strong> Invariance mathématique totale (ROC-AUC quasi-parfaite à <strong>84,8 %</strong>, Δ = 0,00). Les arbres opèrent par partitionnement monotone et ignorent la magnitude des valeurs extrêmes.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-line bg-paper-card p-3">
              <p className="text-xs font-semibold text-ink">Action Technique Préconisée :</p>
              <p className="mt-1 text-xs text-ink-muted">
                Privilégier <strong>XGBoost</strong> en production. Si un modèle linéaire est réactivé, imposer impérativement un écrêtage par winsorisation (99e centile) ou un <code>RobustScaler</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: NaNs Stress Test */}
      {activeTab === 'nans' && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Chart Panel */}
          <div className="rounded-xl border border-line bg-paper p-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Résistance à 15 % de Valeurs Manquantes (PR-AUC en %)</h3>
                <p className="text-xs text-ink-muted">Injection aléatoire de NaNs sur toutes les colonnes d'inférence</p>
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nansChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#e4dfd4" vertical={false} />
                  <XAxis dataKey="model" tick={{ fill: '#16181d', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[55, 70]} tick={{ fill: '#6d7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Normal" name="Normal" fill="#0f5f5b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NaNs_15" name="Avec 15% NaNs" fill="#8a5a12" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-muted">
              Maintien de la performance sous forte dégradation des données d'entrée.
            </p>
          </div>

          {/* Colleague's Interpretation */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-line bg-paper/50 p-4 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
                <AlertTriangle className="h-4 w-4" />
                Interprétation : Pipeline de Sauvegarde
              </div>
              <h4 className="mt-1 font-serif text-lg font-bold text-ink">
                Validation de la Stratégie d'Imputation
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Lorsque 15 % des données d'un client sont incomplètes en cours d'inférence :
              </p>
              <div className="mt-3 space-y-2 text-xs text-ink-soft">
                <div className="flex items-center justify-between rounded-md border border-line bg-paper-card p-2">
                  <span>Régression Logistique</span>
                  <span className="font-semibold text-gold">Δ PR-AUC = -0,0349</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-line bg-paper-card p-2">
                  <span>Random Forest</span>
                  <span className="font-semibold text-gold">Δ PR-AUC = -0,0445</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-line bg-paper-card p-2">
                  <span>XGBoost</span>
                  <span className="font-semibold text-gold">Δ PR-AUC = -0,0443</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                La dégradation maximale reste contenue <strong>sous les 0,045 pts</strong>. La stratégie d'imputation médiane pour les variables continues et mode pour les variables catégorielles est donc pleinement <strong>certifiée pour la production</strong>.
              </p>
            </div>

            <div className="rounded-lg border border-gold/40 bg-gold/10 p-2.5 text-xs text-gold">
              <strong>Seuil d'alerte de data drift :</strong> Déclencher une notification automatique si le volume de données incomplètes dépasse 10 % en production.
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Noise Robustness */}
      {activeTab === 'noise' && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Chart Panel */}
          <div className="rounded-xl border border-line bg-paper p-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Immunité face au Bruit Injecté (PR-AUC en %)</h3>
                <p className="text-xs text-ink-muted">3 colonnes parasites ajoutées : Gaussienne N(0,1), Uniforme [0,100], Constante = 42</p>
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={noiseChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#e4dfd4" vertical={false} />
                  <XAxis dataKey="model" tick={{ fill: '#16181d', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 70]} tick={{ fill: '#6d7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Normal" name="Normal" fill="#0f5f5b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="WithNoise" name="Avec 3 Colonnes Bruit" fill="#3a3f4b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-muted">
              Stabilité absolue : aucun modèle ne surapprend sur les caractéristiques aléatoires.
            </p>
          </div>

          {/* Colleague's Interpretation */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-line bg-paper/50 p-4 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
                <ShieldCheck className="h-4 w-4" />
                Interprétation : Filtre Naturel
              </div>
              <h4 className="mt-1 font-serif text-lg font-bold text-ink">
                Immunité aux Variables Parasites
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Ce banc d'essai évalue comment le modèle réagit lorsque des signaux non informatifs polluent la base de données :
              </p>
              <ul className="mt-3 space-y-2 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
                  <span><strong>Régularisation L2 (Ridge) :</strong> Les coefficients associés aux colonnes de bruit sont spontanément écrasés vers 0.00.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
                  <span><strong>Arbres (Random Forest & XGBoost) :</strong> Le critère d'impureté de Gini / gain XGBoost ignore systématiquement ces colonnes lors de la sélection des séparations.</span>
                </li>
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Conclusion du collègue : Le pipeline est <strong>intrinsèquement sécurisé</strong> contre la contamination accidentelle des magasins de variables (feature stores).
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-teal-soft p-2.5 text-xs text-teal font-medium">
              <Database className="h-4 w-4 shrink-0" />
              <span>Garantie de stabilité en production validée par la R&D.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
