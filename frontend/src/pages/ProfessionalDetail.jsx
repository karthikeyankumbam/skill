import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ProfessionalDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfessional()
  }, [id])

  const fetchProfessional = async () => {
    try {
      const response = await api.get(`/professionals/${id}`)
      setProfessional(response.data.professional)
    } catch (error) {
      toast.error('Error fetching professional')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      const response = await api.post(`/professionals/unlock/${id}`)
      setProfessional(response.data.professional)
      toast.success('Profile unlocked!')
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error('Insufficient credits. Please add funds to your wallet.')
        navigate('/wallet')
      } else {
        toast.error('Error unlocking profile')
      }
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>
  }

  if (!professional) {
    return <div className="text-center py-12">Professional not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start mb-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            {professional.profileImage ? (
              <img src={professional.profileImage} alt={professional.name} className="w-full h-full rounded-full" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <div className="ml-6 flex-1">
            <h1 className="text-3xl font-bold mb-2">{professional.name}</h1>
            <p className="text-xl text-gray-600 mb-4">{professional.profession}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="text-yellow-500">⭐</span>
                <span className="ml-1 font-bold">{professional.rating?.average?.toFixed(1) || 'N/A'}</span>
                <span className="text-gray-500 ml-1">({professional.rating?.count || 0} {t('professional.reviews')})</span>
              </div>
              {professional.isVerified && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Verified</span>
              )}
            </div>
          </div>
        </div>

        {professional.contactLocked ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <p className="text-orange-800 mb-4">{t('professional.contactLocked')}</p>
            <button
              onClick={handleUnlock}
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
            >
              {t('professional.unlockProfile')} (1 Credit)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold mb-2">Contact</h3>
              <p>Phone: {professional.phone}</p>
              {professional.email && <p>Email: {professional.email}</p>}
            </div>
            <div>
              <h3 className="font-bold mb-2">Location</h3>
              <p>{professional.location?.city}, {professional.location?.state}</p>
              <p>Work Radius: {professional.workRadius} km</p>
            </div>
          </div>
        )}

        {professional.bio && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">About</h3>
            <p className="text-gray-700">{professional.bio}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-bold mb-2">{t('professional.pricing')}</h3>
          <p className="text-2xl font-bold text-primary-600">₹{professional.pricing?.basePrice || 'N/A'}</p>
          {professional.pricing?.pricePerHour && (
            <p className="text-gray-600">₹{professional.pricing.pricePerHour} per hour</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/booking/${id}`)}
            className="flex-1 bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 font-bold"
          >
            {t('professional.bookNow')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalDetail

