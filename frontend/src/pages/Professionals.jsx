import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Professionals = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [professionals, setProfessionals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    city: '',
    rating: '',
    search: ''
  })

  useEffect(() => {
    fetchCategories()
    fetchProfessionals()
  }, [filters])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Error fetching categories')
    }
  }

  const fetchProfessionals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.city) params.append('city', filters.city)
      if (filters.rating) params.append('rating', filters.rating)
      if (filters.search) params.append('search', filters.search)

      const response = await api.get(`/professionals?${params.toString()}`)
      setProfessionals(response.data.professionals)
    } catch (error) {
      toast.error('Error fetching professionals')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Find Professionals</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border rounded-md"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="px-4 py-2 border rounded-md"
          />
          <select
            value={filters.rating}
            onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>
      </div>

      {/* Professionals List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">{t('common.loading')}</div>
      ) : (
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
      )}
    </div>
  )
}

export default Professionals

