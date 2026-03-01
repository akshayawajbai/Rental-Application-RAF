import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { API } from '../../config/api'
import '../../compoundcss/Hero.css'
import '../../compoundcss/RoomRent.css'

function RoomRent() {
  const [years, setYears] = useState([])
  const [months, setMonths] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [commonAmount, setCommonAmount] = useState('')
  const [totalRoomRent, setTotalRoomRent] = useState('')
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingMonths, setLoadingMonths] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [editingSummaryIndex, setEditingSummaryIndex] = useState(null)
  const [ownerPaidDateEdit, setOwnerPaidDateEdit] = useState('')
  const [savingSummaryIndex, setSavingSummaryIndex] = useState(null)

  const fetchSummary = async (year) => {
    const y = year ?? (selectedYear || new Date().getFullYear())
    setLoadingSummary(true)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(
        `${API.rentalGetMonthlySummary}?year=${encodeURIComponent(y)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!res.ok) throw new Error('Failed to load summary')
      const data = await res.json()
      setSummary(Array.isArray(data) ? data : [])
    } catch (e) {
      setSummary([])
    } finally {
      setLoadingSummary(false)
    }
  }

  useEffect(() => {
    const y = selectedYear || new Date().getFullYear()
    fetchSummary(y)
  }, [selectedYear])

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
    fetchYears()
  }, [])

  useEffect(() => {
    if (!selectedYear) {
      setMonths([])
      setSelectedMonth(null)
      return
    }
    setLoadingMonths(true)
    setSelectedMonth(null)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const monthId = selectedMonth?.monthId ?? 0
    const common = Number(commonAmount) || 0
    const total = Number(totalRoomRent) || 0

    if (!monthId) {
      toast.error('Please select a month.')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(API.rentalCreateMonthlyRent, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ monthId, commonAmount: common, totalRoomRent: total })
      })
      if (!res.ok) throw new Error('Failed to create monthly rent')
      toast.success('Monthly rent created successfully.')
      setCommonAmount('')
      setTotalRoomRent('')
      fetchSummary(selectedYear)
    } catch (e) {
      toast.error(e.message || 'Failed to create monthly rent')
    } finally {
      setSubmitting(false)
    }
  }

  function ownerPaidDateToInput(value) {
    if (!value || value === 'Not Paid') return ''
    const parts = String(value).trim().split(/[-/]/)
    if (parts.length >= 3) {
      const [a, b, c] = parts
      if (c?.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
      if (a?.length === 4) return `${a}-${b.padStart(2, '0')}-${(c || b).padStart(2, '0')}`
    }
    return ''
  }

  async function handleSetOwnerPaidDate(row, index) {
    const summaryId = row.summaryId ?? row.id ?? 0
    if (!summaryId) {
      toast.error('Summary ID not available.')
      return
    }
    const paidDate = ownerPaidDateEdit
      ? new Date(ownerPaidDateEdit + 'T12:00:00').toISOString()
      : new Date().toISOString()
    setSavingSummaryIndex(index)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(API.rentalSetOwnerPaidDate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ summaryId, ownerPaidDate: paidDate })
      })
      if (!res.ok) throw new Error('Failed to set owner paid date')
      toast.success('Owner paid date updated.')
      setEditingSummaryIndex(null)
      setOwnerPaidDateEdit('')
      fetchSummary(selectedYear)
    } catch (e) {
      toast.error(e.message || 'Failed to set owner paid date')
    } finally {
      setSavingSummaryIndex(null)
    }
  }

  return (
    <div className="hero-root admin-page">
      <header className="hero-header">
        <div className="hero-title-group">
          <h1 className="hero-title">Room Rent</h1>
          <p className="hero-subtitle">Create monthly rent entry.</p>
        </div>
      </header>

      <section className="room-rent-section">
        <form onSubmit={handleSubmit} className="room-rent-form">
          <div className="room-rent-row">
            <div className="room-rent-field">
              <label htmlFor="room-rent-year">Year</label>
              <select
                id="room-rent-year"
                className="room-rent-select"
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

            <div className="room-rent-field">
              <label htmlFor="room-rent-month">Month</label>
              <select
                id="room-rent-month"
                className="room-rent-select"
                value={selectedMonth?.monthId ?? ''}
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

            <div className="room-rent-field">
              <label htmlFor="room-rent-common">Common Amount</label>
              <input
                id="room-rent-common"
                type="number"
                min="0"
                step="any"
                className="room-rent-input"
                placeholder="0"
                value={commonAmount}
                onChange={(e) => setCommonAmount(e.target.value)}
              />
            </div>

            <div className="room-rent-field">
              <label htmlFor="room-rent-total">Total Room Rent</label>
              <input
                id="room-rent-total"
                type="number"
                min="0"
                step="any"
                className="room-rent-input"
                placeholder="0"
                value={totalRoomRent}
                onChange={(e) => setTotalRoomRent(e.target.value)}
              />
            </div>
          </div>

          <div className="room-rent-actions">
            <button type="submit" className="room-rent-submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </section>

      <section className="room-rent-summary-section">
        <h2 className="room-rent-summary-title">
          Monthly Summary
          {selectedYear && (
            <span className="room-rent-summary-year"> ({selectedYear})</span>
          )}
        </h2>
        {loadingSummary ? (
          <p className="room-rent-summary-loading">Loading summary...</p>
        ) : summary.length === 0 ? (
          <p className="room-rent-summary-empty">No monthly summary yet.</p>
        ) : (
          <div className="room-rent-summary-wrap">
            <table className="room-rent-summary-table">
              <thead>
                <tr>
                  <th className="room-rent-summary-th-left">Month</th>
                  <th className="room-rent-summary-th-num">Total Room Rent</th>
                  <th className="room-rent-summary-th-num">Total Collected</th>
                  <th className="room-rent-summary-th-num">Remaining</th>
                  <th className="room-rent-summary-th-left">Owner Paid Date</th>
                  <th className="room-rent-summary-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => {
                  const isEditing = editingSummaryIndex === i
                  const isSaving = savingSummaryIndex === i
                  return (
                    <tr key={i}>
                      <td className="room-rent-summary-td-left">{row.month}</td>
                      <td className="room-rent-summary-td-num">{formatNum(row.totalRoomRent)}</td>
                      <td className="room-rent-summary-td-num">{formatNum(row.totalCollected)}</td>
                      <td className="room-rent-summary-td-num">{formatNum(row.remaining)}</td>
                      <td className="room-rent-summary-td-left">
                        {isEditing ? (
                          <input
                            type="date"
                            className="room-rent-summary-date-input"
                            value={ownerPaidDateEdit}
                            onChange={(e) => setOwnerPaidDateEdit(e.target.value)}
                          />
                        ) : (
                          row.ownerPaidDate ?? '—'
                        )}
                      </td>
                      <td className="room-rent-summary-td-actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="room-rent-summary-btn-apply"
                              onClick={() => handleSetOwnerPaidDate(row, i)}
                              disabled={isSaving}
                            >
                              {isSaving ? '...' : 'Apply'}
                            </button>
                            <button
                              type="button"
                              className="room-rent-summary-btn-cancel"
                              onClick={() => {
                                setEditingSummaryIndex(null)
                                setOwnerPaidDateEdit('')
                              }}
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="room-rent-summary-btn-edit"
                            onClick={() => {
                              setEditingSummaryIndex(i)
                              setOwnerPaidDateEdit(ownerPaidDateToInput(row.ownerPaidDate) || new Date().toISOString().slice(0, 10))
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function formatNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString()
}

export default RoomRent
