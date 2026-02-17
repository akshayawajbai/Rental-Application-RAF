import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../compoundcss/Hero.css'

function Report() {
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
          <h1 className="hero-title">Report Dashboard</h1>
        </div>
      </header>
    </div>
  )
}

export default Report

