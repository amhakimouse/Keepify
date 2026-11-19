import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import { ShellContext } from './contexts/ShellContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ClientDashboard from './pages/ClientDashboard'
import Prediction from './pages/Prediction'
import Predictions from './pages/Predictions'
import Subscription from './pages/Subscription'
import AdminStats from './pages/AdminStats'
import AdminUsers from './pages/AdminUsers'
import AdminRetrain from './pages/AdminRetrain'

function homeFor(user) {
  return user?.role === 'admin' ? '/admin/stats' : '/'
}

function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="text-center">
        <p className="font-serif text-2xl text-ink">Keepify</p>
        <p className="mt-2 text-sm text-ink-muted">Ouverture de l'espace de travail</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <BootScreen />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />
  return children
}

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <ShellContext.Provider value={{ menuOpen, setMenuOpen }}>
      <div className="flex min-h-screen bg-paper">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="flex-1 px-4 py-6 sm:px-8 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </ShellContext.Provider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute roles={['client', 'admin']}><Layout /></ProtectedRoute>}>
            <Route index element={<ClientDashboard />} />
            <Route path="predict" element={<Prediction />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="subscription" element={<Subscription />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/stats" replace />} />
            <Route path="stats" element={<AdminStats />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="retrain" element={<AdminRetrain />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
