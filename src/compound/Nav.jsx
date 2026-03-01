import { Home, FileText, User, LogOut, ChevronDown, HelpCircle, Settings, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { API } from '../config/api'
import '../compoundcss/Nav.css'

const THEME_KEY = 'theme'

function Nav() {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false)
  const [userData, setUserData] = useState({ name: 'Loading...', profileImage: null })
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || localStorage.getItem(THEME_KEY) || 'dark')
  const dropdownRef = useRef(null)
  const reportDropdownRef = useRef(null)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, next)
    document.documentElement.setAttribute('data-theme', next)
    setTheme(next)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    toast.success('Logged out successfully.')
    navigate('/', { replace: true })
  }

  // Fetch user data and role from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        // 1️⃣ Get profile info
        const profileResponse = await fetch(
          API.usersProfile,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!profileResponse.ok) throw new Error()

        const profileData = await profileResponse.json()

        // 2️⃣ Get profile image path
        const imageResponse = await fetch(
          API.usersProfileImage,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        let imageUrl = null

        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          imageUrl = `${API.base}${imageData.image}`
        }

        setUserData({
          name: profileData.name || 'User',
          profileImage: imageUrl
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
        setUserData({ name: 'User', profileImage: null })
      }
    }

    fetchUserData()
  }, [])

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target)) {
        setReportDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
    setReportDropdownOpen(false)
  }

  const toggleReportDropdown = () => {
    setReportDropdownOpen(!reportDropdownOpen)
    setDropdownOpen(false)
  }

  return (
    <nav className={`nav-root ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-left">
          <div className="nav-logo-wrapper">
            <h1 className="nav-title">Rental</h1>
            <div className="nav-accent-line"></div>
          </div>
        </div>

        <div className="nav-right">
          <div className="nav-links">
            <button 
              type="button" 
              className="nav-link" 
              aria-label="Home" 
              onClick={() => navigate('/hero')}
            >
              <div className="nav-link-icon">
                <Home size={18} strokeWidth={2} />
              </div>
              <span className="nav-link-text">Home</span>
            </button>

            <div className="nav-report-wrap" ref={reportDropdownRef}>
              <button
                type="button"
                className={`nav-link nav-link-report ${reportDropdownOpen ? 'open' : ''}`}
                aria-label="Report"
                aria-expanded={reportDropdownOpen}
                onClick={toggleReportDropdown}
              >
                <div className="nav-link-icon">
                  <FileText size={18} strokeWidth={2} />
                </div>
                <span className="nav-link-text">Modules</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`nav-report-chevron ${reportDropdownOpen ? 'open' : ''}`}
                />
              </button>
              {reportDropdownOpen && (
                <div className="nav-report-dropdown">
                  <button
                    type="button"
                    className="nav-report-dropdown-item"
                    onClick={() => {
                      navigate('/report/month-screen')
                      setReportDropdownOpen(false)
                    }}
                  >
                    Month Screen
                  </button>
                  <button
                    type="button"
                    className="nav-report-dropdown-item"
                    onClick={() => {
                      navigate('/report/purchase-screen')
                      setReportDropdownOpen(false)
                    }}
                  >
                    Purchase Screen
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="nav-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun size={18} strokeWidth={2} />
              ) : (
                <Moon size={18} strokeWidth={2} />
              )}
            </button>
          </div>

          <div className="nav-divider"></div>

          <div className="nav-icon-group">
            <div className="nav-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="nav-profile-btn"
                aria-label="User profile"
                onClick={toggleDropdown}
              >
                <div className="profile-avatar">
                  {userData.profileImage ? (
                    <img 
                      src={userData.profileImage} 
                      alt="Profile" 
                      className="profile-image"
                    />
                  ) : (
                    <div className="profile-placeholder">
                      <User size={18} strokeWidth={2} />
                    </div>
                  )}
                  <div className="profile-status-dot"></div>
                </div>
                <ChevronDown 
                  size={16} 
                  strokeWidth={2.5}
                  className={`chevron-icon ${dropdownOpen ? 'open' : ''}`} 
                />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-avatar-large">
                        {userData.profileImage ? (
                          <img 
                            src={userData.profileImage} 
                            alt="Profile" 
                            className="dropdown-profile-image"
                          />
                        ) : (
                          <div className="avatar-placeholder-large">
                            <User size={24} strokeWidth={2} />
                          </div>
                        )}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{userData.name}</span>
                        <span className="user-status">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dropdown-section">
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/profile')
                        setDropdownOpen(false)
                      }}
                    >
                      <div className="dropdown-item-icon">
                        <Settings size={18} strokeWidth={2} />
                      </div>
                      <span>Account Settings</span>
                    </button>
                    
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/help')
                        setDropdownOpen(false)
                      }}
                    >
                      <div className="dropdown-item-icon">
                        <HelpCircle size={18} strokeWidth={2} />
                      </div>
                      <span>Help & Support</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="nav-logout-btn"
              aria-label="Logout" 
              onClick={handleLogout}
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Nav
