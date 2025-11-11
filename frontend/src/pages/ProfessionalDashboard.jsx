import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ProfessionalDashboard = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        api.get('/professionals/dashboard/stats'),
        api.get('/professionals/dashboard/jobs')
      ])
      setStats(statsRes.data.stats)
      setJobs(jobsRes.data.bookings)
    } catch (error) {
      toast.error('Error fetching dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/accept`)
      toast.success('Booking accepted')
      fetchData()
    } catch (error) {
      toast.error('Error accepting booking')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Professional Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2">Total Bookings</h3>
            <p className="text-3xl font-bold">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2">Active</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.activeBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2">Rating</h3>
            <p className="text-3xl font-bold">{stats.rating?.average?.toFixed(1) || 'N/A'}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Job Requests</h2>
        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{job.service?.name}</h3>
                    <p className="text-gray-600">{job.user?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {job.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {new Date(job.serviceDate).toLocaleDateString()} at {job.serviceTime}
                </p>
                {job.status === 'pending' && (
                  <button
                    onClick={() => handleAccept(job.id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Accept
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No job requests</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfessionalDashboard

