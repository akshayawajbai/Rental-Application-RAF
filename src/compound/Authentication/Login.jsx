import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../compoundcss/Login.css'
const API_BASE_URL = import.meta.env.VITE_API_LOGIN_URL

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        const userRole = await fetchUserRole(token)
        
        if (userRole === 'ADMIN') {
          navigate('/admin', { replace: true })
        } else if (userRole === 'USER') {
          navigate('/hero', { replace: true })
        } else {
          // Fallback to hero if role is not recognized
          navigate('/hero', { replace: true })
        }
      }
    }
    
    checkExistingAuth()
  }, [navigate])

  const fetchUserRole = async (token) => {
    try {
      const response = await fetch(import.meta.env.VITE_API_USER_ROLE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user role')
      }

      const userData = await response.json()
      return userData.role
    } catch (error) {
      console.error('Error fetching user role:', error)
      return null
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }

    setLoading(true)
    try {
      const url = `${API_BASE_URL}?username=${encodeURIComponent(
        username,
      )}&password=${encodeURIComponent(password)}`

      const response = await fetch(url, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Invalid username or password.')
      }

      const data = await response.json().catch(() => null)

      let token = null
      if (data && typeof data === 'object' && 'token' in data) {
        token = data.token
      }

      if (token) {
        localStorage.setItem('authToken', token)
        
        // Fetch user role and navigate accordingly
        const userRole = await fetchUserRole(token)
        
        if (userRole === 'ADMIN') {
          navigate('/admin', { replace: true })
        } else if (userRole === 'USER') {
          navigate('/hero', { replace: true })
        } else {
          // Fallback to hero if role is not recognized
          navigate('/hero', { replace: true })
        }
      } else {
        navigate('/hero', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-root">
      <div className="card login-card">
        <h1 className="title">Rental Application</h1>
        <p className="subtitle">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="helper-text">
          Use your existing account credentials to access the application.
        </p>
      </div>
    </div>
  )
}

export default Login

