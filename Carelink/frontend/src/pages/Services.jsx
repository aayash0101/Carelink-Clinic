import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { DEPARTMENTS_LIST, PRODUCTS_LIST } from '../services/endpoints'
import './Services.css'

const Services = () => {
  const [services, setServices] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const selectedDept = searchParams.get('department')

  const [filters, setFilters] = useState({
    department: selectedDept || '',
    search: ''
  })

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || ''

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchServices()
  }, [filters])

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get(DEPARTMENTS_LIST)
      if (data && data.success && data.data.departments) {
        setDepartments(data.data.departments)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.department) params.append('category', filters.department)
      if (filters.search) params.append('search', filters.search)

      const { data } = await api.get(`${PRODUCTS_LIST}?${params.toString()}`)
      if (data && data.success && data.data.products) {
        setServices(data.data.products)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  if (loading && services.length === 0) {
    return <div className="loading">Loading services...</div>
  }

  return (
    <div className="shop-page">
      <div className="container">
        <h1 className="page-title">Medical Services</h1>

        <div className="shop-content">
          <aside className="filters">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                name="search"
                placeholder="Search services..."
                value={filters.search}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Department</label>
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="filter-input"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </aside>

          <main className="products-grid">
            {services.length === 0 ? (
              <div className="no-products">No services found</div>
            ) : (
              services.map((service) => (
                <Link key={service._id} to={`/services/${service._id}`} className="product-card">
                  <div className="product-image">
                    {service.images && service.images[0] ? (
                      <img 
                        src={service.images[0].startsWith('http') ? service.images[0] : `${API_BASE}${service.images[0]}`} 
                        alt={service.name} 
                      />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{service.name}</h3>
                    <p className="product-category">{service.category?.name || service.category}</p>
                    <div className="product-price">
                      <span className="price">Rs. {service.price?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Services

