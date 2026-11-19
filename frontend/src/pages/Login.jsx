import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { auth } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, loading: authLoading, login } = useAuth()

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-serif text-2xl">Keepify</p>
      </div>
    )
  }
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/stats' : '/'} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await auth.login(form)
      localStorage.setItem('token', res.data.access_token)
      const me = await auth.me()
      login(res.data.access_token, me.data)
      navigate(me.data.role === 'admin' ? '/admin/stats' : '/', { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Identifiant ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-ink px-12 py-12 text-white lg:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Keepify</p>
          <h1 className="mt-8 max-w-md font-serif text-5xl leading-tight">
            Voir le départ avant qu'il n'arrive.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-white/70">
            Un espace de pilotage pour estimer le risque de résiliation, suivre les cohortes et garder le modèle à jour.
          </p>
        </div>
        <p className="text-xs text-white/40">Modèle actif sélectionné par PR-AUC sur le portefeuille Telco.</p>
      </section>

      <section className="flex items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-md">
          <p className="font-serif text-3xl text-ink lg:hidden">Keepify</p>
          <h2 className="mt-6 font-serif text-4xl text-ink">Connexion</h2>
          <p className="mt-2 text-sm text-ink-muted">Accédez à votre espace Keepify.</p>

          <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                className="input-field"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                className="input-field"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg border border-clay/20 bg-clay/5 px-3 py-2 text-sm text-clay">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Connexion…' : 'Entrer'}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-muted">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-semibold text-teal">Créer un accès client</Link>
          </p>
          <p className="mt-8 text-xs text-ink-muted">
            Démonstration : admin / admin123 · client / client123
          </p>
        </div>
      </section>
    </div>
  )
}
