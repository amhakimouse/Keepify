import { Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useShell } from '../contexts/ShellContext'

export default function Navbar() {
  const { user } = useAuth()
  const shell = useShell()
  const initial = user?.username ? user.username[0].toUpperCase() : 'U'

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg border border-line p-2 text-ink lg:hidden"
            onClick={() => shell?.setMenuOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">Keepify</p>
            <p className="text-sm font-semibold text-ink">Intelligence de rétention</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-ink">{user?.username}</p>
            <p className="text-xs capitalize text-ink-muted">{user?.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-soft font-semibold text-teal">
            {initial}
          </div>
        </div>
      </div>
    </header>
  )
}
