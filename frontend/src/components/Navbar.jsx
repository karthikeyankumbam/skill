import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from 'react-i18next'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              SkillLink
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select
              onChange={(e) => changeLanguage(e.target.value)}
              value={i18n.language}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिंदी</option>
              <option value="ta">தமிழ்</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>

            {isAuthenticated ? (
              <>
                <Link to="/professionals" className="px-4 py-2 text-gray-700 hover:text-primary-600">
                  {t('common.home')}
                </Link>
                <Link to="/my-bookings" className="px-4 py-2 text-gray-700 hover:text-primary-600">
                  {t('common.bookings')}
                </Link>
                <Link to="/wallet" className="px-4 py-2 text-gray-700 hover:text-primary-600">
                  {t('common.wallet')}
                </Link>
                {user?.role === 'professional' && (
                  <Link to="/professional/dashboard" className="px-4 py-2 text-gray-700 hover:text-primary-600">
                    Dashboard
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="px-4 py-2 text-gray-700 hover:text-primary-600">
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="px-4 py-2 text-gray-700 hover:text-primary-600">
                  {t('common.profile')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-primary-600">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

