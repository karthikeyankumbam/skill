import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Wallet = () => {
  const { t } = useTranslation()
  const [wallet, setWallet] = useState(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWallet()
  }, [])

  const fetchWallet = async () => {
    try {
      const response = await api.get('/wallet')
      setWallet(response.data.wallet)
    } catch (error) {
      toast.error('Error fetching wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) < 1) {
      toast.error('Minimum amount is ₹1')
      return
    }

    try {
      const response = await api.post('/wallet/add-funds', { amount: parseFloat(amount) })
      // In production, integrate Razorpay checkout
      toast.success('Payment initiated')
      // After payment verification, refresh wallet
    } catch (error) {
      toast.error('Error adding funds')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('common.wallet')}</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">{t('wallet.balance')}</h3>
          <p className="text-3xl font-bold text-primary-600">₹{wallet?.balance || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 mb-2">{t('wallet.credits')}</h3>
          <p className="text-3xl font-bold text-primary-600">{wallet?.credits || 0}</p>
        </div>
      </div>

      {/* Add Funds */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">{t('wallet.addFunds')}</h2>
        <div className="flex gap-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="flex-1 px-4 py-2 border rounded-md"
            min="1"
          />
          <button
            onClick={handleAddFunds}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">{t('wallet.transactions')}</h2>
        <div className="space-y-4">
          {wallet?.transactions?.length > 0 ? (
            wallet.transactions.map((txn, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-4">
                <div>
                  <p className="font-medium">{txn.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-bold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount)}
                  {txn.credits !== 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({txn.credits >= 0 ? '+' : ''}{txn.credits} credits)
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Wallet

