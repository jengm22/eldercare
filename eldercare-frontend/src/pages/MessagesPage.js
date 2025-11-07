import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/api';
import { Users, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await messageService.getAll(patientId);
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const patientId = user.patientId || 1;
      await messageService.send(patientId, { message: newMessage });
      setNewMessage('');
      toast.success('Message sent');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Care Team Messages</h2>

      <div className="bg-white rounded-lg shadow flex flex-col h-[calc(100vh-250px)]">
        {/* Messages Header */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Messages with Care Team</h3>
          <p className="text-sm text-gray-600 mt-1">
            Communicate with your caregivers, family, and healthcare providers
          </p>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isCurrentUser = msg.user_id === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="text-purple-600" size={20} />
                    </div>
                  </div>
                  <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      {!isCurrentUser && (
                        <>
                          <p className="font-semibold text-sm">
                            {msg.first_name} {msg.last_name}
                          </p>
                          <span className="text-xs text-gray-500 capitalize">
                            {msg.role}
                          </span>
                        </>
                      )}
                      {isCurrentUser && (
                        <p className="font-semibold text-sm">You</p>
                      )}
                    </div>
                    <div
                      className={`inline-block rounded-lg px-4 py-3 max-w-md ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Start a conversation with your care team
              </p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessagesPage;