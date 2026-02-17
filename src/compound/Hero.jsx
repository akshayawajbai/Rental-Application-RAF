import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../compoundcss/Hero.css'

function Hero() {
  const navigate = useNavigate()

  // Guard: if there is no token, send user back to login
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return (
    <div className="hero-root">
      <header className="hero-header">
        <div className="hero-title-group">
          <h1 className="hero-title">Rental Dashboard</h1>
          <p className="hero-subtitle">Welcome back to your dashboard.</p>
        </div>
      </header>

      <main className="hero-main">
        <section className="hero-cards">
          <div className="hero-card">
            <h2>Total Properties</h2>
            <p className="hero-card-number">12</p>
          </div>
          <div className="hero-card">
            <h2>Active Rentals</h2>
            <p className="hero-card-number">8</p>
          </div>
          <div className="hero-card">
            <h2>Pending Requests</h2>
            <p className="hero-card-number">3</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Hero

