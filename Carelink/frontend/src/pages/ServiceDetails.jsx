import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/Auth.jsx'
import { toast } from 'react-toastify'
import { PRODUCT_DETAIL } from '../services/endpoints'
import './ServiceDetails.css'

const ServiceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  // If VITE_API_URL is like http://localhost:5000/api, this becomes http://localhost:5000
  const IMAGE_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')

  useEffect(() => {
    fetchService()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchService = async () => {
    if (!id) {
      toast.error('Invalid service ID')
      navigate('/services')
      return
    }

    try {
      setLoading(true)

      const { data } = await api.get(PRODUCT_DETAIL(id))

      const found = data?.data?.service || data?.data?.product
      if (data?.success && found) {
        setService(found)
        setSelectedImage(0)
      } else {
        toast.error('Service not found')
        navigate('/services')
      }
    } catch (error) {
      console.error('Error fetching service:', error)
      toast.error('Service not found')
      navigate('/services')
    } finally {
      setLoading(false)
    }
  }

  const getFullImgPath = (imgPath) => {
    if (!imgPath) return ''
    if (imgPath.startsWith('http')) return imgPath
    return `${IMAGE_BASE}${imgPath}`
  }

  const handleBookAppointment = () => {
    if (!isAuthenticated) {
      toast.info('Please login to book an appointment')
      navigate('/login')
      return
    }
    const serviceId = service?._id || id
    navigate(`/book/${serviceId}`)
  }

  if (loading) return <div className="loading">Loading...</div>
  if (!service) return <div className="error">Service not found</div>

  return (
    <div className="product-page">
      <div className="container">
        <div className="product-detail">
          <div className="product-images">
            <div className="main-image">
              {service.images?.[selectedImage] ? (
                <img
                  src={getFullImgPath(service.images[selectedImage])}
                  alt={service.name}
                />
              ) : (
                <div className="placeholder-image">No Image</div>
              )}
            </div>

            {Array.isArray(service.images) && service.images.length > 1 && (
              <div className="thumbnail-images">
                {service.images.map((img, index) => (
                  <img
                    key={index}
                    src={getFullImgPath(img)}
                    alt="thumbnail"
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-info">
            <h1 className="product-title">{service.name}</h1>

            <div className="product-meta">
              <span className="product-category">
                {service.category?.name || service.category || '—'}
              </span>
            </div>

            <div className="product-price-section">
              <span className="product-price">
                Rs. {Number(service.price || 0).toLocaleString()}
              </span>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{service.description}</p>
            </div>

            <div className="product-actions">
              <button onClick={handleBookAppointment} className="btn btn-primary btn-large">
                Book Appointment
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ServiceDetails
