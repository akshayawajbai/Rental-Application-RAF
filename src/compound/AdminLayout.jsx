import { useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar.jsx'
import '../compoundcss/AdminSidebar.css'

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const activePath = location.pathname

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return (
    <div className="admin-layout">
      <AdminSidebar activePath={activePath} />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
