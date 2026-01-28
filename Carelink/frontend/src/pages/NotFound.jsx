import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h1 style={{ fontSize: '4rem', color: '#D4AF37' }}>404</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">Return Home</Link>
    </div>
  )
}
export default NotFound