import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [pendingKYC, setPendingKYC] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, kycRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/professionals/pending-kyc')
      ])
      setStats(statsRes.data.stats)
      setPendingKYC(kycRes.data.professionals)
    } catch (error) {
      toast.error('Error fetching dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveKYC = async (professionalId) => {
    try {
      await api.put(`/admin/professionals/${professionalId}/approve-kyc`)
      toast.success('KYC approved')
      fetchData()
    } catch (error) {
      toast.error('Error approving KYC')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold">{stats.users.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2">Professionals</h3>
            <p className="text-3xl font-bold">{stats.professionals.total}</p>
            <p className="text-sm text-yellow-600">{stats.professionals.pending} pending</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2">Bookings</h3>
            <p className="text-3xl font-bold">{stats.bookings.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 mb-2">Revenue</h3>
            <p className="text-3xl font-bold">₹{stats.revenue.total}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Pending KYC Approvals</h2>
        <div className="space-y-4">
          {pendingKYC.length > 0 ? (
            pendingKYC.map((prof) => (
              <div key={prof._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{prof.userId?.name}</h3>
                    <p className="text-gray-600">{prof.profession}</p>
                  </div>
                  <button
                    onClick={() => handleApproveKYC(prof._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No pending KYC approvals</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

