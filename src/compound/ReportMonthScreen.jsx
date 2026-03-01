import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { API } from '../config/api'
import '../compoundcss/Hero.css'
import '../compoundcss/ReportMonthScreen.css'

function formatNum(n) {
  if (n == null || n === '') return '0'
  const x = Number(n)
  return Number.isNaN(x) ? '0' : x.toLocaleString()
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function ReportMonthScreen() {
  const navigate = useNavigate()
  const [years, setYears] = useState([])
  const [months, setMonths] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [monthlyRent, setMonthlyRent] = useState(null)
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingMonths, setLoadingMonths] = useState(false)
  const [loadingRent, setLoadingRent] = useState(false)
  const [monthNotFound, setMonthNotFound] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/', { replace: true })
      return
    }

    const fetchYears = async () => {
      try {
        const res = await fetch(API.rentalGetAllYears, { headers: getAuthHeaders() })
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
        const res = await fetch(API.rentalGetActiveMonthlyRent, { headers: getAuthHeaders() })
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
      } catch (e) {
        toast.error(e.message || 'Failed to load active month')
      }
    }

    fetchYears()
    fetchActiveMonthlyRent()
  }, [navigate])

  useEffect(() => {
    if (!selectedYear) {
      setMonths([])
      setSelectedMonth(null)
      setMonthlyRent(null)
      return
    }
    setLoadingMonths(true)
    setSelectedMonth(null)
    setMonthlyRent(null)
    const fetchMonths = async () => {
      try {
        const res = await fetch(
          `${API.rentalGetMonthsByYear}/${selectedYear}`,
          { headers: getAuthHeaders() }
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
      const res = await fetch(
        `${API.rentalGetMonthlyRent}/${monthId}`,
        { headers: getAuthHeaders() }
      )
      if (!res.ok) {
        if (res.status === 404) {
          setMonthNotFound(true)
          toast.error('That month entry is not created.')
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
  const isPaid = (p) => p.paidDate && String(p.paidDate).toUpperCase() !== 'NOT PAID'

  return (
    <div className="hero-root report-month-root">
      <header className="hero-header">
        <div className="hero-title-group">
          <h1 className="hero-title">Report – Month Screen</h1>
          <p className="hero-subtitle">View monthly rent summary and payments.</p>
        </div>
      </header>

      <section className="report-month-filters">
        <div className="report-month-filter-row">
          <div className="report-month-field">
            <label htmlFor="report-year">Year</label>
            <select
              id="report-year"
              className="report-month-select"
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
          <div className="report-month-field">
            <label htmlFor="report-month">Month</label>
            <select
              id="report-month"
              className="report-month-select"
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
          <button
            type="button"
            className="report-month-show-btn"
            onClick={handleShow}
            disabled={loadingRent || !selectedMonth}
          >
            {loadingRent ? 'Loading...' : 'Show report'}
          </button>
        </div>
      </section>

      {monthNotFound && (
        <div className="report-month-empty">
          <p>That month entry is not created. Create it from Admin → Room Rent.</p>
        </div>
      )}

      {monthlyRent && (
        <>
          <section className="report-month-overview">
            <h2 className="report-month-section-title">{monthlyRent.monthName}</h2>
            <div className="report-month-stats">
              <div className="report-month-stat-card">
                <span className="report-month-stat-label">Common amount</span>
                <span className="report-month-stat-value">{formatNum(monthlyRent.commonAmount)}</span>
              </div>
              <div className="report-month-stat-card">
                <span className="report-month-stat-label">Total room rent</span>
                <span className="report-month-stat-value">{formatNum(monthlyRent.totalRoomRent)}</span>
              </div>
              <div className="report-month-stat-card">
                <span className="report-month-stat-label">Previous balance</span>
                <span className="report-month-stat-value">{formatNum(monthlyRent.previousBalance)}</span>
              </div>
            </div>
          </section>

          {summary && (
            <section className="report-month-summary-section">
              <h2 className="report-month-section-title">Summary</h2>
              <div className="report-month-summary-cards">
                <div className="report-month-summary-card">
                  <span className="report-month-summary-label">Total room rent</span>
                  <span className="report-month-summary-value">{formatNum(summary.totalRoomRent)}</span>
                </div>
                <div className="report-month-summary-card report-month-summary-card--collected">
                  <span className="report-month-summary-label">Total collected</span>
                  <span className="report-month-summary-value">{formatNum(summary.totalCollected)}</span>
                </div>
                <div className="report-month-summary-card report-month-summary-card--remaining">
                  <span className="report-month-summary-label">Remaining</span>
                  <span className="report-month-summary-value">{formatNum(summary.remaining)}</span>
                </div>
              </div>
            </section>
          )}

          <section className="report-month-payments-section">
            <h2 className="report-month-section-title">Payments</h2>
            <div className="report-month-payments-grid">
              {payments.map((p) => (
                <div
                  key={p.userId}
                  className={`report-month-payment-card ${isPaid(p) ? 'paid' : 'pending'}`}
                >
                  <div className="report-month-payment-header">
                    <span className="report-month-payment-name">{p.userName ?? '—'}</span>
                    <span className={`report-month-payment-badge ${isPaid(p) ? 'paid' : 'pending'}`}>
                      {isPaid(p) ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="report-month-payment-details">
                    <div className="report-month-payment-row">
                      <span>Expected</span>
                      <span className="report-month-payment-num">{formatNum(p.expectedAmount)}</span>
                    </div>
                    <div className="report-month-payment-row">
                      <span>Prev balance</span>
                      <span className="report-month-payment-num">{formatNum(p.previousBalance)}</span>
                    </div>
                    <div className="report-month-payment-row">
                      <span>Balance</span>
                      <span className="report-month-payment-num">{formatNum(p.balance)}</span>
                    </div>
                    <div className="report-month-payment-row">
                      <span>Paid date</span>
                      <span>{p.paidDate ?? '—'}</span>
                    </div>
                    <div className="report-month-payment-row report-month-payment-row--split">
                      <span>GPay</span>
                      <span className="report-month-payment-num">{formatNum(p.gpayPaid)}</span>
                    </div>
                    <div className="report-month-payment-row report-month-payment-row--split">
                      <span>Cash</span>
                      <span className="report-month-payment-num">{formatNum(p.cashPaid)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {!monthlyRent && !monthNotFound && selectedMonth && !loadingRent && (
        <div className="report-month-empty">
          <p>Select year and month, then click &quot;Show report&quot;.</p>
        </div>
      )}
    </div>
  )
}

export default ReportMonthScreen
