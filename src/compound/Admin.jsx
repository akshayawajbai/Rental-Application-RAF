import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar.jsx'
import '../compoundcss/Hero.css'
import '../compoundcss/AdminSidebar.css'

function Admin() {
  const navigate = useNavigate()
  const location = useLocation()
  const activePath = location.pathname === '/admin' ? '/admin/room-rent' : location.pathname

  // Guard: if there is no token, send user back to login
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleSidebarNavigate = (path) => {
    navigate(path)
  }

  return (
    <div className="admin-layout">
      <AdminSidebar activePath={activePath} onNavigate={handleSidebarNavigate} />
      <main className="admin-content hero-root">
        <header className="hero-header">
          <div className="hero-title-group">
            <h1 className="hero-title">Admin Dashboard</h1>
            <p className="hero-subtitle">Welcome back to your dashboard.</p>
          </div>
        </header>

        <section className="hero-main">
          <div className="hero-cards">
            <div className="hero-card">
              <h2>Total Properties</h2>
              <p className="hero-card-number">12</p>
            </div>
            <div className="hero-card">
              <h2>Active Rentals</h2>
              <p className="hero-card-number">1</p>
            </div>
            <div className="hero-card">
              <h2>Pending Requests</h2>
              <p className="hero-card-number">3</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Admin

