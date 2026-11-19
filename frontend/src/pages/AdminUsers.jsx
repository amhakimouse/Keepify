import { useEffect, useState } from 'react'
import { users } from '../services/api'

export default function AdminUsers() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    users.list()
      .then((res) => setList(res.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return
    setError('')
    try {
      await users.remove(id)
      setList((current) => current.filter((user) => user.id !== id))
    } catch {
      setError('Suppression impossible. Ce compte a peut-être encore des prédictions liées.')
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Chargement des comptes…</p>

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Direction</p>
        <h2 className="mt-1 font-serif text-4xl text-ink">Comptes</h2>
        <p className="mt-2 text-sm text-ink-muted">{list.length} accès enregistrés.</p>
      </div>
      {error && <p className="text-sm text-clay">{error}</p>}
      <section className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Créé le', ''].map((label) => (
                <th key={label || 'actions'} className="px-5 py-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((user) => (
              <tr key={user.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-medium">{user.username}</td>
                <td className="px-5 py-3 text-ink-soft">{user.email}</td>
                <td className="px-5 py-3 capitalize">{user.role}</td>
                <td className="px-5 py-3">{user.is_active ? 'Actif' : 'Inactif'}</td>
                <td className="px-5 py-3 text-ink-muted">{user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(user.id)} className="text-sm font-semibold text-clay">
                    Retirer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
