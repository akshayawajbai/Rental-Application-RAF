import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Hero from './compound/Hero.jsx'
import Login from './compound/Authentication/Login.jsx'
import Nav from './compound/Nav.jsx'
import Profile from './compound/Profile.jsx'
import AdminLayout from './compound/AdminLayout.jsx'
import ProtectedRoute from './compound/Authentication/ProtectedRoute.jsx'
import Report from './compound/Report.jsx'
import ReportMonthScreen from './compound/ReportMonthScreen.jsx'
import ReportPurchaseScreen from './compound/ReportPurchaseScreen.jsx'
import UserState from './compound/userstate.jsx'
import CounterEffect from './compound/useEffect.jsx'
import AdminHome from './compound/admin/AdminHome.jsx'
import RoomRent from './compound/admin/RoomRent.jsx'
import MonthEntry from './compound/admin/MonthEntry.jsx'
import AddPurchase from './compound/admin/AddPurchase.jsx'
import CurrentBill from './compound/admin/CurrentBill.jsx'
import UpdateUsers from './compound/admin/UpdateUsers.jsx'

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
        <Route path='/userstate' element={<UserState />} />
        <Route path='/useEffect' element={<CounterEffect />} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminHome />} />
          <Route path="room-rent" element={<RoomRent />} />
          <Route path="month-entry" element={<MonthEntry />} />
          <Route path="add-purchase" element={<AddPurchase />} />
          <Route path="current-bill" element={<CurrentBill />} />
          <Route path="update-users" element={<UpdateUsers />} />
        </Route>
        <Route path="/report" element={<Report />} />
        <Route path="/report/month-screen" element={<ReportMonthScreen />} />
        <Route path="/report/purchase-screen" element={<ReportPurchaseScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}

export default App
