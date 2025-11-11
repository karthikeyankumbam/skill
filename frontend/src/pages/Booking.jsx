import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Booking = () => {
  const { professionalId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [professional, setProfessional] = useState(null)
  const [formData, setFormData] = useState({
    serviceDate: '',
    serviceTime: '',
    address: '',
    description: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProfessional()
  }, [professionalId])

  const fetchProfessional = async () => {
    try {
      const response = await api.get(`/professionals/${professionalId}`)
      setProfessional(response.data.professional)
    } catch (error) {
      toast.error('Error fetching professional')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.post('/bookings', {
        professional: professionalId,
        service: professional.services?.[0]?._id,
        category: professional.category?._id,
        ...formData
      })
      toast.success('Booking created successfully!')
      navigate('/my-bookings')
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error('Insufficient credits. Please add funds to your wallet.')
        navigate('/wallet')
      } else {
        toast.error(error.response?.data?.message || 'Error creating booking')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('booking.createBooking')}</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="font-bold text-lg mb-2">{professional?.name}</h3>
        <p className="text-gray-600">{professional?.profession}</p>
        <p className="text-primary-600 font-bold mt-2">₹{professional?.pricing?.basePrice || 'N/A'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('booking.serviceDate')}
          </label>
          <input
            type="date"
            value={formData.serviceDate}
            onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('booking.serviceTime')}
          </label>
          <input
            type="time"
            value={formData.serviceTime}
            onChange={(e) => setFormData({ ...formData, serviceTime: e.target.value })}
            required
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('booking.address')}
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            rows={3}
            className="w-full px-4 py-2 border rounded-md"
            placeholder="Enter your address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('booking.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border rounded-md"
            placeholder="Describe the service you need"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 border rounded-md hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? t('common.loading') : t('booking.confirm')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Booking

