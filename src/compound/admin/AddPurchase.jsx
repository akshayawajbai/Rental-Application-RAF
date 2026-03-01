import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { API } from '../../config/api'
import '../../compoundcss/Hero.css'
import '../../compoundcss/AddPurchase.css'

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

function AddPurchase() {
  const [years, setYears] = useState([])
  const [months, setMonths] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [purchases, setPurchases] = useState([])
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0)
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingMonths, setLoadingMonths] = useState(false)
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingPurchaseId, setEditingPurchaseId] = useState(null)
  const [editForm, setEditForm] = useState({ itemName: '', amount: '', purchaseDate: '' })
  const [applyingPurchaseId, setApplyingPurchaseId] = useState(null)

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
      setPurchases([])
      setTotalPurchaseAmount(0)
      return
    }
    setLoadingMonths(true)
    setSelectedMonth(null)
    setPurchases([])
    setTotalPurchaseAmount(0)
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

  const fetchPurchases = async (monthId) => {
    if (!monthId) return
    setLoadingPurchases(true)
    try {
      const res = await fetch(
        `${API.purchaseGetByMonth}/${monthId}`,
        { headers: getAuthHeadersNoContentType() }
      )
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.')
        if (res.status === 403) throw new Error('Only Admin can view purchases')
        throw new Error('Failed to load purchases')
      }
      const data = await res.json()
      const list = data.purchases ?? data.Purchases ?? (Array.isArray(data) ? data : [])
      const total = data.totalAmount ?? data.TotalAmount ?? 0
      setPurchases(Array.isArray(list) ? list : [])
      setTotalPurchaseAmount(Number(total) || 0)
    } catch (e) {
      toast.error(e.message || 'Failed to load purchases')
      setPurchases([])
      setTotalPurchaseAmount(0)
    } finally {
      setLoadingPurchases(false)
    }
  }

  const handleShow = () => {
    const monthId = selectedMonth?.monthId
    if (!monthId) {
      setMessage({ type: 'error', text: 'Please select a month.' })
      return
    }
    fetchPurchases(monthId)
  }

  const handleAddPurchase = async (e) => {
    e.preventDefault()
    const monthId = selectedMonth?.monthId
    if (!monthId) {
      toast.error('Please select a month.')
      return
    }
    const name = itemName.trim()
    const amt = Number(amount)
    if (!name) {
      toast.error('Item name is required.')
      return
    }
    if (Number.isNaN(amt) || amt < 0) {
      toast.error('Enter a valid amount.')
      return
    }
    const dateStr = purchaseDate
      ? new Date(purchaseDate + 'T12:00:00').toISOString()
      : new Date().toISOString()

    setSubmitting(true)
    try {
      const res = await fetch(API.purchaseAdd, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          monthId,
          itemName: name,
          amount: amt,
          purchaseDate: dateStr
        })
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.')
        if (res.status === 403) throw new Error('Only Admin can add purchases')
        const errText = await res.text()
        throw new Error(errText || 'Failed to add purchase')
      }
      toast.success('Purchase added successfully.')
      setItemName('')
      setAmount('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      fetchPurchases(monthId)
    } catch (e) {
      toast.error(e.message || 'Failed to add purchase')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (p) => {
    setEditingPurchaseId(p.purchaseId)
    setEditForm({
      itemName: p.itemName || '',
      amount: String(p.amount ?? ''),
      purchaseDate: purchaseDateToInput(p.purchaseDate) || new Date().toISOString().slice(0, 10)
    })
  }

  const cancelEdit = () => {
    setEditingPurchaseId(null)
    setApplyingPurchaseId(null)
    setEditForm({ itemName: '', amount: '', purchaseDate: '' })
  }

  const handleApplyEdit = async (purchaseId) => {
    const monthId = selectedMonth?.monthId
    if (!monthId) return
    const name = editForm.itemName.trim()
    const amt = Number(editForm.amount)
    if (!name) {
      toast.error('Item name is required.')
      return
    }
    if (Number.isNaN(amt) || amt < 0) {
      toast.error('Enter a valid amount.')
      return
    }
    const dateStr = editForm.purchaseDate
      ? new Date(editForm.purchaseDate + 'T12:00:00').toISOString()
      : new Date().toISOString()

    setApplyingPurchaseId(purchaseId)
    try {
      const res = await fetch(`${API.purchaseUpdate}/${purchaseId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          monthId,
          itemName: name,
          amount: amt,
          purchaseDate: dateStr
        })
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in again.')
        if (res.status === 403) throw new Error('Only Admin can update purchases')
        if (res.status === 404) throw new Error('Purchase not found')
        const errText = await res.text()
        throw new Error(errText || 'Failed to update purchase')
      }
      toast.success('Purchase updated successfully.')
      cancelEdit()
      fetchPurchases(monthId)
    } catch (e) {
      toast.error(e.message || 'Failed to update purchase')
    } finally {
      setApplyingPurchaseId(null)
    }
  }

  return (
    <div className="hero-root admin-page">
      <header className="hero-header">
        <div className="hero-title-group">
          <h1 className="hero-title">Add Purchase</h1>
          <p className="hero-subtitle">Add and manage purchases by month.</p>
        </div>
      </header>

      <section className="add-purchase-section">
        <div className="add-purchase-row">
          <div className="add-purchase-field">
            <label htmlFor="add-purchase-year">Year</label>
            <select
              id="add-purchase-year"
              className="add-purchase-select"
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
          <div className="add-purchase-field">
            <label htmlFor="add-purchase-month">Month</label>
            <select
              id="add-purchase-month"
              className="add-purchase-select"
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
          <div className="add-purchase-field add-purchase-actions">
            <button
              type="button"
              className="add-purchase-show-btn"
              onClick={handleShow}
              disabled={loadingPurchases || !selectedMonth}
            >
              {loadingPurchases ? 'Loading...' : 'Show purchases'}
            </button>
          </div>
        </div>

        <form className="add-purchase-form" onSubmit={handleAddPurchase}>
          <div className="add-purchase-row">
            <div className="add-purchase-field">
              <label htmlFor="add-purchase-item">Item name</label>
              <input
                id="add-purchase-item"
                type="text"
                className="add-purchase-input"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item name"
                disabled={!selectedMonth}
              />
            </div>
            <div className="add-purchase-field">
              <label htmlFor="add-purchase-amount">Amount</label>
              <input
                id="add-purchase-amount"
                type="number"
                min="0"
                step="0.01"
                className="add-purchase-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                disabled={!selectedMonth}
              />
            </div>
            <div className="add-purchase-field">
              <label htmlFor="add-purchase-date">Purchase date</label>
              <input
                id="add-purchase-date"
                type="date"
                className="add-purchase-input"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={!selectedMonth}
              />
            </div>
            <div className="add-purchase-field add-purchase-actions">
              <button
                type="submit"
                className="add-purchase-submit"
                disabled={submitting || !selectedMonth}
              >
                {submitting ? 'Adding...' : 'Add purchase'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {purchases.length > 0 && (
        <section className="add-purchase-list-section">
          <div className="add-purchase-list-header">
            <h2 className="add-purchase-list-title">
              Purchases{selectedMonth?.monthName ? ` – ${selectedMonth.monthName}` : ''}
            </h2>
            <p className="add-purchase-list-total">
              Total: <span className="add-purchase-list-total-value">{formatNum(totalPurchaseAmount)}</span>
            </p>
          </div>
          <div className="add-purchase-table-wrap">
            <table className="add-purchase-table">
              <thead>
                <tr>
                  <th className="add-purchase-th-left">Item name</th>
                  <th className="add-purchase-th-num">Amount</th>
                  <th className="add-purchase-th-left">Purchase date</th>
                  <th className="add-purchase-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => {
                  const isEditing = editingPurchaseId === p.purchaseId
                  const isApplying = applyingPurchaseId === p.purchaseId
                  return (
                    <tr key={p.purchaseId}>
                      {isEditing ? (
                        <>
                          <td className="add-purchase-td-edit">
                            <input
                              type="text"
                              className="add-purchase-edit-input"
                              value={editForm.itemName}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, itemName: e.target.value }))
                              }
                              placeholder="Item name"
                            />
                          </td>
                          <td className="add-purchase-td-edit">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="add-purchase-edit-input"
                              value={editForm.amount}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, amount: e.target.value }))
                              }
                              placeholder="0"
                            />
                          </td>
                          <td className="add-purchase-td-edit">
                            <input
                              type="date"
                              className="add-purchase-edit-input"
                              value={editForm.purchaseDate}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, purchaseDate: e.target.value }))
                              }
                            />
                          </td>
                          <td className="add-purchase-td-actions">
                            <button
                              type="button"
                              className="add-purchase-btn-apply"
                              onClick={() => handleApplyEdit(p.purchaseId)}
                              disabled={isApplying}
                            >
                              {isApplying ? 'Saving...' : 'Apply'}
                            </button>
                            <button
                              type="button"
                              className="add-purchase-btn-cancel"
                              onClick={cancelEdit}
                              disabled={isApplying}
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="add-purchase-td-left">{p.itemName || '–'}</td>
                          <td className="add-purchase-td-num">{formatNum(p.amount)}</td>
                          <td className="add-purchase-td-left">
                            {p.purchaseDate
                              ? purchaseDateToInput(p.purchaseDate)
                              : '–'}
                          </td>
                          <td className="add-purchase-td-actions">
                            <button
                              type="button"
                              className="add-purchase-btn-edit"
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
        </section>
      )}

      {selectedMonth && purchases.length === 0 && !loadingPurchases && (
        <section className="add-purchase-list-section">
          <p className="add-purchase-empty">No purchases for this month. Add one above.</p>
        </section>
      )}
    </div>
  )
}

export default AddPurchase
