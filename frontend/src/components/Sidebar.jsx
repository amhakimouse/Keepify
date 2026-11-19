import { NavLink } from 'react-router-dom'
import {
  Activity, BarChart3, CreditCard, Home, LogOut, Shield, Users, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useShell } from '../contexts/ShellContext'

const clientItems = [
  { name: 'Accueil', icon: Home, path: '/' },
  { name: 'Prédiction', icon: Activity, path: '/predict' },
  { name: 'Historique', icon: BarChart3, path: '/predictions' },
  { name: 'Abonnement', icon: CreditCard, path: '/subscription' },
]

const adminItems = [
  { name: 'Pilotage', icon: BarChart3, path: '/admin/stats' },
  { name: 'Comptes', icon: Users, path: '/admin/users' },
  { name: 'Modèles', icon: RefreshCw, path: '/admin/retrain' },
]

function Item({ item, onNavigate }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-white/70 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.name}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const shell = useShell()
  const open = shell?.menuOpen
  const close = () => shell?.setMenuOpen(false)

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Fermer le menu"
          onClick={close}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-ink text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal text-sm font-semibold">K</div>
          <div>
            <p className="font-serif text-lg leading-none">Keepify</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/45">Retention</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3">
          <div>
            <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.16em] text-white/35">Espace client</p>
            <div className="space-y-1">
              {clientItems.map((item) => (
                <Item key={item.path} item={item} onNavigate={close} />
              ))}
            </div>
          </div>
          {user?.role === 'admin' && (
            <div>
              <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.16em] text-white/35">Direction</p>
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <Item key={item.path} item={item} onNavigate={close} />
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
          <p className="mt-3 flex items-center gap-2 px-3 text-[11px] text-white/40">
            <Shield className="h-3 w-3" />
            {user?.role === 'admin' ? 'Accès direction' : 'Accès client'}
          </p>
        </div>
      </aside>
    </>
  )
}
