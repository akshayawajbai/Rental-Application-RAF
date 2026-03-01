import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { API } from '../../config/api'
import '../../compoundcss/Hero.css'
import '../../compoundcss/CurrentBill.css'

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

function formatNum(n) {
  if (n == null || n === '') return '0'
  const x = Number(n)
  return Number.isNaN(x) ? '0' : x.toLocaleString()
}

function purchaseDateToInput(value) {
  if (!value) return ''
  const s = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const parts = s.split(/[-/]/)
  if (parts.length >= 3) {
    const [a, b, c] = parts
    if (c?.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
    if (a?.length === 4) return `${a}-${b.padStart(2, '0')}-${(c || b).padStart(2, '0')}`
  }
  return ''
}

function CurrentBill() {
  const [years, setYears] = useState([])
  const [months, setMonths] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [currentBill, setCurrentBill] = useState(null)
  const [amount, setAmount] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingMonths, setLoadingMonths] = useState(false)
  const [loadingBill, setLoadingBill] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ amount: '', purchaseDate: '' })
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch(API.rentalGetAllYears, {
          headers: getAuthHeadersNoContentType()
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
      setCurrentBill(null)
      return
    }
    setLoadingMonths(true)
    setSelectedMonth(null)
    setCurrentBill(null)
    const fetchMonths = async () => {
      try {
        const res = await fetch(
          `${API.rentalGetMonthsByYear}/${selectedYear}`,
          { headers: getAuthHeadersNoContentType() }
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

  const fetchCurrentBill = async (monthId) => {
    if (!monthId) return
    setLoadingBill(true)
    try {
      const res = await fetch(
        `${API.currentbillGet}/${monthId}`,
        { headers: getAuthHeadersNoContentType() }
      )
      if (res.status === 404) {
        setCurrentBill(null)
        setLoadingBill(false)
        return
      }
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.')
        if (res.status === 403) throw new Error('Only Admin can view current bill')
        throw new Error('Failed to load current bill')
      }
      const data = await res.json()
      const bill = {
        purchaseId: data.purchaseId ?? data.PurchaseId,
        monthId: data.monthId ?? data.MonthId,
        amount: data.amount ?? data.Amount,
        purchaseDate: data.purchaseDate ?? data.PurchaseDate ?? null
      }
      setCurrentBill(bill)
    } catch (e) {
      toast.error(e.message || 'Failed to load current bill')
      setCurrentBill(null)
    } finally {
      setLoadingBill(false)
    }
  }

  const handleShow = () => {
    const monthId = selectedMonth?.monthId
    if (!monthId) {
      toast.error('Please select a month.')
      return
    }
    fetchCurrentBill(monthId)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    const monthId = selectedMonth?.monthId
    if (!monthId) {
      toast.error('Please select a month.')
      return
    }
    const amt = Number(amount)
    if (Number.isNaN(amt) || amt < 0) {
      toast.error('Enter a valid amount.')
      return
    }
    const dateStr = purchaseDate
      ? new Date(purchaseDate + 'T12:00:00').toISOString()
      : new Date().toISOString()

    setSubmitting(true)
    try {
      const res = await fetch(API.currentbillAdd, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          monthId,
          itemName: 'Current Bill',
          amount: amt,
          purchaseDate: dateStr
        })
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.')
        if (res.status === 403) throw new Error('Only Admin can add current bill')
        const errText = await res.text()
        throw new Error(errText || 'Failed to add current bill')
      }
      toast.success('Current bill added successfully.')
      setAmount('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      fetchCurrentBill(monthId)
    } catch (e) {
      toast.error(e.message || 'Failed to add current bill')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = () => {
    if (!currentBill) return
    setEditing(true)
    setEditForm({
      amount: String(currentBill.amount ?? ''),
      purchaseDate: purchaseDateToInput(currentBill.purchaseDate) || new Date().toISOString().slice(0, 10)
    })
  }

  const cancelEdit = () => {
    setEditing(false)
    setApplying(false)
    setEditForm({ amount: '', purchaseDate: '' })
  }

  const handleApplyEdit = async () => {
    const monthId = selectedMonth?.monthId
    const purchaseId = currentBill?.purchaseId ?? currentBill?.PurchaseId
    if (!monthId || !purchaseId) return
    const amt = Number(editForm.amount)
    if (Number.isNaN(amt) || amt < 0) {
      toast.error('Enter a valid amount.')
      return
    }
    const dateStr = editForm.purchaseDate
      ? new Date(editForm.purchaseDate + 'T12:00:00').toISOString()
      : new Date().toISOString()

    setApplying(true)
    try {
      const res = await fetch(
        `${API.currentbillUpdate}/${purchaseId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            monthId,
            itemName: 'Current Bill',
            amount: amt,
            purchaseDate: dateStr
          })
        }
      )
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.')
        if (res.status === 403) throw new Error('Only Admin can update current bill')
        if (res.status === 404) throw new Error('Current bill not found')
        const errText = await res.text()
        throw new Error(errText || 'Failed to update current bill')
      }
      toast.success('Current bill updated successfully.')
      cancelEdit()
      fetchCurrentBill(monthId)
    } catch (e) {
      toast.error(e.message || 'Failed to update current bill')
    } finally {
      setApplying(false)
    }
  }

  const monthName = selectedMonth?.monthName ?? selectedMonth?.monthName ?? ''

  return (
    <div className="hero-root admin-page">
      <header className="hero-header">
        <div className="hero-title-group">
          <h1 className="hero-title">Current bill</h1>
          <p className="hero-subtitle">Add or update the current bill for a month (electricity, etc.).</p>
        </div>
      </header>

      <section className="current-bill-section">
        <div className="current-bill-row">
          <div className="current-bill-field">
            <label htmlFor="current-bill-year">Year</label>
            <select
              id="current-bill-year"
              className="current-bill-select"
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
          <div className="current-bill-field">
            <label htmlFor="current-bill-month">Month</label>
            <select
              id="current-bill-month"
              className="current-bill-select"
              value={selectedMonth?.monthId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value)
                setSelectedMonth(months.find((m) => m.monthId === id) || null)
              }}
              disabled={loadingMonths || !selectedYear}
            >
              <option value="">Select month</option>
              {months.map((m) => (
                <option key={m.monthId} value={m.monthId}>{m.monthName}</option>
              ))}
            </select>
          </div>
          <div className="current-bill-field current-bill-actions">
            <button
              type="button"
              className="current-bill-show-btn"
              onClick={handleShow}
              disabled={loadingBill || !selectedMonth}
            >
              {loadingBill ? 'Loading...' : 'Show'}
            </button>
          </div>
        </div>

        </section>

      {loadingBill && (
        <section className="current-bill-content">
          <p className="current-bill-loading">Loading current bill...</p>
        </section>
      )}

      {!loadingBill && selectedMonth && !currentBill && (
        <section className="current-bill-content">
          <div className="current-bill-empty-card">
            <p className="current-bill-empty-title">No current bill for this month</p>
            <p className="current-bill-empty-desc">
              Add a current bill (e.g. electricity) for {monthName || 'the selected month'}.
            </p>
            <form className="current-bill-form" onSubmit={handleAdd}>
              <div className="current-bill-form-row">
                <div className="current-bill-field">
                  <label htmlFor="current-bill-amount">Amount</label>
                  <input
                    id="current-bill-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="current-bill-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="current-bill-field">
                  <label htmlFor="current-bill-date">Bill date</label>
                  <input
                    id="current-bill-date"
                    type="date"
                    className="current-bill-input"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
                <div className="current-bill-field current-bill-actions">
                  <button
                    type="submit"
                    className="current-bill-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add current bill'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      {!loadingBill && currentBill && (
        <section className="current-bill-content">
          <div className="current-bill-card">
            <div className="current-bill-card-header">
              <h2 className="current-bill-card-title">
                Current bill{monthName ? ` – ${monthName}` : ''}
              </h2>
            </div>
            {editing ? (
              <div className="current-bill-edit-row">
                <div className="current-bill-field">
                  <label htmlFor="current-bill-edit-amount">Amount</label>
                  <input
                    id="current-bill-edit-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="current-bill-input"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="current-bill-field">
                  <label htmlFor="current-bill-edit-date">Bill date</label>
                  <input
                    id="current-bill-edit-date"
                    type="date"
                    className="current-bill-input"
                    value={editForm.purchaseDate}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, purchaseDate: e.target.value }))
                    }
                  />
                </div>
                <div className="current-bill-field current-bill-actions current-bill-edit-actions">
                  <button
                    type="button"
                    className="current-bill-btn-apply"
                    onClick={handleApplyEdit}
                    disabled={applying}
                  >
                    {applying ? 'Saving...' : 'Apply'}
                  </button>
                  <button
                    type="button"
                    className="current-bill-btn-cancel"
                    onClick={cancelEdit}
                    disabled={applying}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="current-bill-details">
                  <div className="current-bill-detail-row">
                    <span className="current-bill-detail-label">Amount</span>
                    <span className="current-bill-detail-value">{formatNum(currentBill.amount)}</span>
                  </div>
                  <div className="current-bill-detail-row">
                    <span className="current-bill-detail-label">Bill date</span>
                    <span className="current-bill-detail-value">
                      {currentBill.purchaseDate
                        ? purchaseDateToInput(currentBill.purchaseDate)
                        : '–'}
                    </span>
                  </div>
                </div>
                <div className="current-bill-card-actions">
                  <button
                    type="button"
                    className="current-bill-btn-edit"
                    onClick={startEdit}
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default CurrentBill
