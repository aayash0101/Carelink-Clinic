import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { DEPARTMENTS_LIST } from '../services/endpoints'
import './Services.css'

const Departments = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(DEPARTMENTS_LIST)
      if (data && data.success && data.data.departments) {
        setDepartments(data.data.departments)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading departments...</div>
  }

  return (
    <div className="shop-page">
      <div className="container">
        <h1 className="page-title">Medical Departments</h1>
        <p className="page-subtitle">Select a department to view available services</p>

        <div className="products-grid">
          {departments.length === 0 ? (
            <div className="no-products">No departments available</div>
          ) : (
            departments.map((dept) => (
              <Link key={dept._id} to={`/services?department=${dept._id}`} className="product-card">
                <div className="product-info">
                  <h3 className="product-name">{dept.name}</h3>
                  <p className="product-category">View Services →</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Departments

