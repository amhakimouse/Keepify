import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../services/api'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    try {
      await auth.register({ ...form, role: 'client' })
      setSuccess('Compte créé. Vous pouvez vous connecter.')
      setTimeout(() => navigate('/login'), 900)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : "Erreur lors de l'inscription")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-md">
        <p className="font-serif text-3xl text-ink">Keepify</p>
        <h2 className="mt-6 font-serif text-4xl">Créer un accès</h2>
        <p className="mt-2 text-sm text-ink-muted">Les nouveaux comptes sont des comptes client.</p>
        <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
          <div>
            <label className="label">Nom d'utilisateur</label>
            <input className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <p className="rounded-lg border border-clay/20 bg-clay/5 px-3 py-2 text-sm text-clay">{error}</p>}
          {success && <p className="rounded-lg border border-teal/20 bg-teal-soft px-3 py-2 text-sm text-teal">{success}</p>}
          <button type="submit" className="btn-primary w-full">Créer le compte</button>
        </form>
        <p className="mt-6 text-sm text-ink-muted">
          Déjà inscrit ? <Link to="/login" className="font-semibold text-teal">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
