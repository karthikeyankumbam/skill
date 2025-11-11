import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Home = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, professionalsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/professionals?limit=6')
      ])
      setCategories(categoriesRes.data.categories)
      setProfessionals(professionalsRes.data.professionals)
    } catch (error) {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('home.title')}</h1>
        <p className="text-xl text-gray-600 mb-8">{t('home.subtitle')}</p>
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{t('home.categories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => navigate(`/professionals?category=${category.id}`)}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer text-center"
            >
              <div className="text-4xl mb-2">{category.icon}</div>
              <div className="text-sm font-medium">{category.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Professionals */}
      <div>
        <h2 className="text-2xl font-bold mb-6">{t('home.featured')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((professional) => (
            <div
              key={professional.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg cursor-pointer"
              onClick={() => navigate(`/professionals/${professional.id}`)}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {professional.profileImage ? (
                      <img src={professional.profileImage} alt={professional.name} className="w-full h-full rounded-full" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-lg">{professional.name}</h3>
                    <p className="text-gray-600">{professional.profession}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-yellow-500">⭐</span>
                    <span className="ml-1">{professional.rating?.average?.toFixed(1) || 'N/A'}</span>
                    <span className="text-gray-500 ml-1">({professional.rating?.count || 0})</span>
                  </div>
                  <div className="text-primary-600 font-bold">
                    ₹{professional.pricing?.basePrice || 'N/A'}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  📍 {professional.location?.city || 'N/A'}
                </div>
                {professional.contactLocked && (
                  <div className="text-sm text-orange-600 mb-2">
                    {t('professional.contactLocked')}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/professionals/${professional.id}`)
                  }}
                  className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700"
                >
                  {professional.contactLocked ? t('professional.unlockProfile') : t('professional.bookNow')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home

