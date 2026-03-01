import { Home, KeyRound, CalendarDays, Users, ShoppingCart, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import '../compoundcss/AdminSidebar.css'

const menuItems = [
  { label: 'Home', icon: Home, path: '/admin' },
  { label: 'Room Rent', icon: KeyRound, path: '/admin/room-rent' },
  { label: 'Month entry', icon: CalendarDays, path: '/admin/month-entry' },
  { label: 'Add Purchase', icon: ShoppingCart, path: '/admin/add-purchase' },
  { label: 'Current bill', icon: FileText, path: '/admin/current-bill' },
  { label: 'Update users', icon: Users, path: '/admin/update-users' }
]

function AdminSidebar({ activePath }) {
  const navigate = useNavigate()

  const handleNav = (path) => {
    navigate(path)
  }

  const isActive = (path) => {
    if (path === '/admin') {
      return activePath === '/admin'
    }
    return activePath === path
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <span className="admin-sidebar-title">Admin</span>
      </div>
      <nav className="admin-sidebar-nav">
        {menuItems.map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            type="button"
            className={`admin-sidebar-item ${isActive(path) ? 'active' : ''}`}
            onClick={() => handleNav(path)}
          >
            <span className="admin-sidebar-icon">
              <Icon size={20} strokeWidth={2} />
            </span>
            <span className="admin-sidebar-label">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar
