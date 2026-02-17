import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, requiredRole }) => {
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          setError(true)
          setLoading(false)
          return
        }

        const response = await fetch(import.meta.env.VITE_API_USER_ROLE_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          setError(true)
          setLoading(false)
          return
        }

        const userData = await response.json()
        setUserRole(userData.role)
      } catch (error) {
        console.error('Error fetching user role:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (error || !userRole) {
    return <Navigate to="/" replace />
  }

  if (requiredRole && userRole !== requiredRole) {
    // If user doesn't have required role, redirect to appropriate page
    if (userRole === 'USER') {
      return <Navigate to="/hero" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
