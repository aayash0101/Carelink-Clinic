import { Link } from 'react-router-dom'
import './Home.css'

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Clinic Appointments</h1>
          <p className="hero-subtitle">Your Health, Our Priority</p>
          <p className="hero-description">
            Book appointments with experienced doctors. Easy scheduling, secure payments, and quality healthcare.
          </p>
          <Link to="/departments" className="btn btn-primary btn-large">
            Book Appointment
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👨‍⚕️</div>
              <h3>Expert Doctors</h3>
              <p>Qualified medical professionals</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Payment</h3>
              <p>eSewa & multiple options</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Easy Booking</h3>
              <p>Schedule appointments online</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💊</div>
              <h3>Multiple Departments</h3>
              <p>Wide range of services</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

