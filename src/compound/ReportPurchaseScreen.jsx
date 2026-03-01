import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../compoundcss/Hero.css'

function ReportPurchaseScreen() {
  const navigate = useNavigate()

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
          <h1 className="hero-title">Report – Purchase Screen</h1>
          <p className="hero-subtitle">Purchase report view.</p>
        </div>
      </header>
      <section className="hero-main">
        <p>Purchase Screen report content.</p>
      </section>
    </div>
  )
}

export default ReportPurchaseScreen
