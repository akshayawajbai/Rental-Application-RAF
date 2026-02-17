import { Routes, Route, Navigate } from 'react-router-dom'
import Hero from './compound/Hero.jsx'
import Login from './compound/Authentication/Login.jsx'
import Nav from './compound/Nav.jsx'
import Profile from './compound/Profile.jsx'
import Admin from './compound/Admin.jsx'
import ProtectedRoute from './compound/Authentication/ProtectedRoute.jsx'
import { Outlet } from 'react-router-dom'
import Report from './compound/Report.jsx'

const LayoutWithNav = () => (
  <div className="page-with-nav">
    <Nav />
    <Outlet />
  </div>
)

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<LayoutWithNav />}>
        <Route path="/hero" element={<Hero />} />
        <Route path="/profile" element={<Profile />} />
        <Route 
          path="/admin" element={<ProtectedRoute requiredRole="ADMIN">
            
            <Admin />
            
            </ProtectedRoute>}
        />
        <Route path="/report" element={<Report/>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}

export default App
