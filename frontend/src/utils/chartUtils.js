export function heatMapColors(value) {
  const abs = Math.abs(value)
  const intensity = Math.min(abs * 2, 1)
  if (value > 0) {
    return `rgba(79, 70, 229, ${intensity * 0.6})` // indigo
  }
  return `rgba(244, 63, 94, ${intensity * 0.6})` // rose
}

export function getRiskColor(segment) {
  switch (segment) {
    case 'Low': return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500' }
    case 'Medium': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', dot: 'bg-amber-500' }
    case 'High': return { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', dot: 'bg-rose-500' }
    default: return { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600', dot: 'bg-slate-500' }
  }
}

export function formatCurrency(v) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

export function formatPercent(v, decimals = 1) {
  return `${v.toFixed(decimals)}%`
}