import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { API } from '../../config/api'
import '../../compoundcss/Hero.css'
import '../../compoundcss/MonthEntry.css'

function MonthEntry() {
  const [years, setYears] = useState([])
  const [months, setMonths] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [monthlyRent, setMonthlyRent] = useState(null)
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingMonths, setLoadingMonths] = useState(false)
  const [loadingRent, setLoadingRent] = useState(false)
  const [monthNotFound, setMonthNotFound] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const navigate = useNavigate()
  const [applyingUserId, setApplyingUserId] = useState(null)
  const [editForm, setEditForm] = useState({ paidDate: '', gpayPaid: '', cashPaid: '' })

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(API.rentalGetAllYears, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) throw new Error('Failed to load years')
        const data = await res.json()
        setYears(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length > 0 && !selectedYear) {
          setSelectedYear(String(data[0]))
        }
      } catch (e) {
        toast.error(e.message || 'Failed to load years')
      } finally {
        setLoadingYears(false)
      }
    }

    const fetchActiveMonthlyRent = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(API.rentalGetActiveMonthlyRent, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) {
          if (res.status === 404) {
            // No active month configured, just skip
            return
          }
          throw new Error('Failed to load active month')
        }
        const data = await res.json()
        setMonthlyRent(data)
        setMonthNotFound(false)
        // Sync selected month from active rent (API returns monthid)
        const mid = data.monthid ?? data.monthId
        if (mid != null) {
          setSelectedMonth({ monthId: mid, monthName: data.monthName ?? `Month ${mid}` })
        }
      } catch (e) {
        toast.error(e.message || 'Failed to load active month')
      }
    }

    fetchYears()
    fetchActiveMonthlyRent()
  }, [])

  useEffect(() => {
    if (!selectedYear) {
      setMonths([])
      setSelectedMonth(null)
      return
    }
    setLoadingMonths(true)
    setSelectedMonth(null)
    // Don't clear monthlyRent here so active monthly rent from rentalGetActiveMonthlyRent can stay visible
    const fetchMonths = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(
          `${API.rentalGetMonthsByYear}/${selectedYear}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
        if (!res.ok) throw new Error('Failed to load months')
        const data = await res.json()
        setMonths(Array.isArray(data) ? data : [])
      } catch (e) {
        toast.error(e.message || 'Failed to load months')
        setMonths([])
      } finally {
        setLoadingMonths(false)
      }
    }
    fetchMonths()
  }, [selectedYear])

  const handleShow = async () => {
    const monthId = selectedMonth?.monthId
    if (!monthId) {
      toast.error('Please select a month.')
      return
    }
    setLoadingRent(true)
    setMonthNotFound(false)
    setMonthlyRent(null)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(
        `${API.rentalGetMonthlyRent}/${monthId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!res.ok) {
        if (res.status === 404) {
          setMonthNotFound(true)
          toast.error('That month entry is not created so create Month for entry.')
          setLoadingRent(false)
          return
        }
        throw new Error('Failed to load monthly rent')
      }
      const data = await res.json()
      setMonthlyRent(data)
    } catch (e) {
      toast.error(e.message || 'Failed to load monthly rent')
    } finally {
      setLoadingRent(false)
    }
  }

  const payments = monthlyRent?.payments ?? []
  const summary = monthlyRent?.summary ?? null

  function paidDateToInput(value) {
    if (!value) return ''
    const parts = String(value).trim().split(/[-/]/)
    if (parts.length >= 3) {
      const [a, b, c] = parts
      if (c?.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
      if (a?.length === 4) return `${a}-${b.padStart(2, '0')}-${(c || b).padStart(2, '0')}`
    }
    return ''
  }

  function startEdit(p) {
    setEditingUserId(p.userId)
    setEditForm({
      paidDate: paidDateToInput(p.paidDate) || new Date().toISOString().slice(0, 10),
      gpayPaid: String(p.gpayPaid ?? ''),
      cashPaid: String(p.cashPaid ?? '')
    })
  }

  function cancelEdit() {
    setEditingUserId(null)
    setApplyingUserId(null)
    setEditForm({ paidDate: '', gpayPaid: '', cashPaid: '' })
  }

  async function handleApply(userId) {
    // Use monthId from monthlyRent (API returns monthid) so Edit/Apply works for active month too
    const monthId = monthlyRent?.monthid ?? monthlyRent?.monthId ?? selectedMonth?.monthId
    if (!monthId) {
      toast.error('Month not found. Please select a month and click Show.')
      return
    }
    const gpayPaid = Number(editForm.gpayPaid) || 0
    const cashPaid = Number(editForm.cashPaid) || 0
    const paidDate = editForm.paidDate
      ? new Date(editForm.paidDate + 'T12:00:00').toISOString()
      : new Date().toISOString()

    setApplyingUserId(userId)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(API.rentalUpdateUserPayment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ monthId, userId, gpayPaid, cashPaid, paidDate })
      })
      if (!res.ok) throw new Error('Failed to update payment')
      toast.success('Payment updated.')
      setEditingUserId(null)
      setApplyingUserId(null)
      setEditForm({ paidDate: '', gpayPaid: '', cashPaid: '' })
      // Refresh current month data using the same monthId we posted
      const refreshRes = await fetch(
        `${API.rentalGetMonthlyRent}/${monthId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json()
        setMonthlyRent(refreshed)
      }
    } catch (e) {
      toast.error(e.message || 'Failed to update payment')
    } finally {
      setApplyingUserId(null)
    }
  }

  return (
    <div className="hero-root admin-page">
      <header className="hero-header">
        <div className="hero-title-group">
          <h1 className="hero-title">Month entry</h1>
          <p className="hero-subtitle">View monthly rent details.</p>
        </div>
      </header>

      <section className="month-entry-section">
        <div className="month-entry-row">
          <div className="month-entry-field">
            <label htmlFor="month-entry-year">Year</label>
            <select
              id="month-entry-year"
              className="month-entry-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={loadingYears}
            >
              <option value="">Select year</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>

          <div className="month-entry-field">
            <label htmlFor="month-entry-month">Month</label>
            <select
              id="month-entry-month"
              className="month-entry-select"
              value={selectedMonth?.monthId ?? monthlyRent?.monthid ?? monthlyRent?.monthId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value)
                setSelectedMonth(months.find(m => m.monthId === id) || null)
              }}
              disabled={loadingMonths || !selectedYear}
            >
              <option value="">Select month</option>
              {months.map((m) => (
                <option key={m.monthId} value={m.monthId}>{m.monthName}</option>
              ))}
            </select>
          </div>

          <div className="month-entry-field month-entry-actions">
            <button
              type="button"
              className="month-entry-show-btn"
              onClick={handleShow}
              disabled={loadingRent || !selectedMonth}
            >
              {loadingRent ? 'Loading...' : 'Show'}
            </button>
          </div>
        </div>

        {monthNotFound && (
          <div className="month-entry-create-prompt">
            <p className="month-entry-create-text">That month entry is not created so create Month for entry.</p>
            <button
              type="button"
              className="month-entry-nav-btn"
              onClick={() => navigate('/admin/room-rent')}
            >
              Create
            </button>
          </div>
        )}
      </section>

      {monthlyRent && (
        <section className="month-entry-detail">
          <div className="month-entry-info">
            <span className="month-entry-info-item">
              <strong>Month:</strong> {monthlyRent.monthName}
            </span>
            <span className="month-entry-info-item">
              <strong>Common Amount:</strong> {formatNum(monthlyRent.commonAmount)}
            </span>
            <span className="month-entry-info-item">
              <strong>Total Room Rent:</strong> {formatNum(monthlyRent.totalRoomRent)}
            </span>
            <span className="month-entry-info-item">
              <strong>Previous Balance:</strong> {formatNum(monthlyRent.previousBalance)}
            </span>
            {summary && (
              <>
                <span className="month-entry-info-item">
                  <strong>Total Collected:</strong> {formatNum(summary.totalCollected)}
                </span>
                <span className="month-entry-info-item">
                  <strong>Remaining:</strong> {formatNum(summary.remaining)}
                </span>
              </>
            )}
          </div>

          <h2 className="month-entry-table-title">Payments</h2>
          <div className="month-entry-table-wrap">
            <table className="month-entry-table">
              <thead>
                <tr>
                  <th className="month-entry-th-left">Name</th>
                  <th className="month-entry-th-num">Expected</th>
                  <th className="month-entry-th-num">Prev Balance</th>
                  <th className="month-entry-th-num">Balance</th>
                  <th className="month-entry-th-left">Paid Date</th>
                  <th className="month-entry-th-num">GPay</th>
                  <th className="month-entry-th-num">Cash</th>
                  <th className="month-entry-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const isEditing = editingUserId === p.userId
                  const isApplying = applyingUserId === p.userId
                  return (
                    <tr key={p.userId}>
                      <td className="month-entry-td-left">{p.userName}</td>
                      <td className="month-entry-td-num">{formatNum(p.expectedAmount)}</td>
                      <td className="month-entry-td-num">{formatNum(p.previousBalance)}</td>
                      <td className="month-entry-td-num">{formatNum(p.balance)}</td>
                      {isEditing ? (
                        <>
                          <td className="month-entry-td-edit">
                            <input
                              type="date"
                              className="month-entry-inline-input"
                              value={editForm.paidDate}
                              onChange={(e) => setEditForm((f) => ({ ...f, paidDate: e.target.value }))}
                            />
                          </td>
                          <td className="month-entry-td-edit">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              className="month-entry-inline-input month-entry-inline-num"
                              placeholder="0"
                              value={editForm.gpayPaid}
                              onChange={(e) => setEditForm((f) => ({ ...f, gpayPaid: e.target.value }))}
                            />
                          </td>
                          <td className="month-entry-td-edit">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              className="month-entry-inline-input month-entry-inline-num"
                              placeholder="0"
                              value={editForm.cashPaid}
                              onChange={(e) => setEditForm((f) => ({ ...f, cashPaid: e.target.value }))}
                            />
                          </td>
                          <td className="month-entry-td-actions">
                            <button
                              type="button"
                              className="month-entry-btn-apply"
                              onClick={() => handleApply(p.userId)}
                              disabled={isApplying}
                            >
                              {isApplying ? '...' : 'Apply'}
                            </button>
                            <button
                              type="button"
                              className="month-entry-btn-cancel"
                              onClick={cancelEdit}
                              disabled={isApplying}
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="month-entry-td-left">{p.paidDate ?? '—'}</td>
                          <td className="month-entry-td-num">{formatNum(p.gpayPaid)}</td>
                          <td className="month-entry-td-num">{formatNum(p.cashPaid)}</td>
                          <td className="month-entry-td-actions">
                            <button
                              type="button"
                              className="month-entry-btn-edit"
                              onClick={() => startEdit(p)}
                            >
                              Edit
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {summary && (
            <div className="month-entry-summary-card">
              <h3 className="month-entry-summary-title">Summary</h3>
              <div className="month-entry-summary-row">
                <span>Total Room Rent</span>
                <span className="month-entry-summary-num">{formatNum(summary.totalRoomRent)}</span>
              </div>
              <div className="month-entry-summary-row">
                <span>Total Collected</span>
                <span className="month-entry-summary-num">{formatNum(summary.totalCollected)}</span>
              </div>
              <div className="month-entry-summary-row">
                <span>Remaining</span>
                <span className="month-entry-summary-num">{formatNum(summary.remaining)}</span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function formatNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString()
}

export default MonthEntry
