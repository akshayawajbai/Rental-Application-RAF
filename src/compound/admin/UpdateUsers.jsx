import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { API } from '../../config/api'
import '../../compoundcss/Hero.css'
import '../../compoundcss/UpdateUsers.css'

function getAuthHeaders() {
  const token = localStorage.getItem('authToken')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function getAuthHeadersNoContentType() {
  const token = localStorage.getItem('authToken')
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function UpdateUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '',
    role: 'USER',
    isActive: true,
    email: '',
    password: ''
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(API.users, {
        headers: getAuthHeadersNoContentType()
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.')
        if (res.status === 403) throw new Error('Only Admin can access this')
        throw new Error('Failed to load users')
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({
      name: user.name || '',
      role: user.role || 'USER',
      isActive: user.isActive !== false,
      email: user.email || '',
      password: ''
    })
    setShowPassword(false)
  }

  const closeEdit = () => {
    setEditingUser(null)
    setForm({ name: '', role: 'USER', isActive: true, email: '', password: '' })
    setShowPassword(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    setSaving(true)
    try {
      const dto = {
        name: form.name.trim(),
        role: form.role,
        isActive: form.isActive,
        email: form.email.trim()
      }
      if (form.password.trim()) dto.password = form.password
      const res = await fetch(`${API.users}/${editingUser.userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto)
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.')
        if (res.status === 403) throw new Error('Only Admin can update users')
        if (res.status === 404) throw new Error('User not found')
        throw new Error('Failed to update user')
      }
      toast.success('User updated successfully.')
      closeEdit()
      fetchUsers()
    } catch (e) {
      toast.error(e.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="hero-root admin-page">
      <header className="hero-header">
        <div className="hero-title-group">
          <h1 className="hero-title">Update users</h1>
          <p className="hero-subtitle">View and edit user accounts.</p>
        </div>
      </header>

      <section className="update-users-section">
        {loading ? (
          <p className="update-users-loading">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="update-users-empty">No users found.</p>
        ) : (
          <div className="update-users-table-wrap">
            <table className="update-users-table">
              <thead>
                <tr>
                  <th className="update-users-th-left">Name</th>
                  <th className="update-users-th-left">Username</th>
                  <th className="update-users-th-center">Role</th>
                  <th className="update-users-th-center">Active</th>
                  <th className="update-users-th-left">Email</th>
                  <th className="update-users-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId}>
                    <td className="update-users-td-left">{u.name ?? '—'}</td>
                    <td className="update-users-td-left">{u.username ?? '—'}</td>
                    <td className="update-users-td-center">
                      <span className={`update-users-badge update-users-badge--${(u.role || '').toLowerCase()}`}>
                        {u.role ?? '—'}
                      </span>
                    </td>
                    <td className="update-users-td-center">
                      {u.isActive ? (
                        <span className="update-users-status update-users-status--active">Active</span>
                      ) : (
                        <span className="update-users-status update-users-status--inactive">Inactive</span>
                      )}
                    </td>
                    <td className="update-users-td-left">{u.email ?? '—'}</td>
                    <td className="update-users-td-actions">
                      <button
                        type="button"
                        className="update-users-btn-edit"
                        onClick={() => openEdit(u)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingUser && (
        <div className="update-users-modal-overlay" onClick={closeEdit}>
          <div className="update-users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="update-users-modal-header">
              <h2 className="update-users-modal-title">Edit user</h2>
              <button type="button" className="update-users-modal-close" onClick={closeEdit} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="update-users-form">
              <div className="update-users-form-row">
                <label className="update-users-label">Username</label>
                <input
                  type="text"
                  className="update-users-input"
                  value={editingUser.username ?? ''}
                  readOnly
                  disabled
                />
                <span className="update-users-hint">(read-only)</span>
              </div>
              <div className="update-users-form-row">
                <label className="update-users-label">Name</label>
                <input
                  type="text"
                  className="update-users-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Full name"
                />
              </div>
              <div className="update-users-form-row">
                <label className="update-users-label">Email</label>
                <input
                  type="email"
                  className="update-users-input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="update-users-form-row">
                <label className="update-users-label">Role</label>
                <select
                  className="update-users-select"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="update-users-form-row update-users-form-row--checkbox">
                <label className="update-users-label update-users-label--checkbox">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span>Active</span>
                </label>
              </div>
              <div className="update-users-form-row">
                <div className="update-users-password-header">
                  <label className="update-users-label">Password</label>
                  <button
                    type="button"
                    className="update-users-btn-password-toggle"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? 'Hide' : 'Set new password'}
                  </button>
                </div>
                {showPassword && (
                  <input
                    type="password"
                    className="update-users-input"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    autoComplete="new-password"
                  />
                )}
              </div>
              <div className="update-users-modal-actions">
                <button type="button" className="update-users-btn-cancel" onClick={closeEdit}>
                  Cancel
                </button>
                <button type="submit" className="update-users-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UpdateUsers
