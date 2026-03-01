import '../../compoundcss/Hero.css'

function AdminHome() {
  return (
    <div className="hero-root admin-page">
      <header className="hero-header">
        <div className="hero-title-group">
          <h1 className="hero-title">Admin</h1>
          <p className="hero-subtitle">Welcome to this page.</p>
        </div>
      </header>
      <section className="hero-main">
          <div className="hero-cards">
            <div className="hero-card">
              <h2>Total Properties</h2>
              <p className="hero-card-number">12</p>
            </div>
            <div className="hero-card">
              <h2>Active Rentals</h2>
              <p className="hero-card-number">1</p>
            </div>
            <div className="hero-card">
              <h2>Pending Requests</h2>
              <p className="hero-card-number">3</p>
            </div>
          </div>
        </section>
    </div>
  )
}

export default AdminHome
