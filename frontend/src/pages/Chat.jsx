import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Chat = () => {
  const { roomId } = useParams()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [roomId])

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/room/${roomId}`)
      setMessages(response.data.chat.messages || [])
    } catch (error) {
      toast.error('Error loading chat')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await api.post('/chat/send', {
        roomId,
        message: newMessage
      })
      setNewMessage('')
      fetchMessages()
    } catch (error) {
      toast.error('Error sending message')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Chat</h1>

      <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className="flex justify-end">
              <div className="bg-primary-100 rounded-lg p-3 max-w-xs">
                <p>{msg.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="border-t p-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-md"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat

