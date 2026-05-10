import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, CheckCheck, User, Phone, MoreVertical } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import { formatDateTime } from '../data/helpers';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientDirectChatView = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  
  const [roomId, setRoomId] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);

  // Ambil atau buat chat room
  useEffect(() => {
    fetchOrCreateChat();
  }, [sellerId]);

  // Scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchOrCreateChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages/direct/room/${sellerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setRoomId(data.data.room_id);
        setPartner(data.data.partner);
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !roomId) return;
    
    setSendingMsg(true);
    const tempId = Date.now();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Optimistic update
    const tempMessage = {
      MESSAGE_ID: tempId,
      SENDER_ID: currentUser?.user_id,
      CONTENT: messageText,
      SENT_AT: new Date().toISOString(),
      IS_TEMP: true
    };
    setMessages(prev => [...prev, tempMessage]);
    setMessageText('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages/direct/room/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: messageText })
      });
      const data = await res.json();
      
      if (data.success) {
        // Refresh messages
        await fetchOrCreateChat();
      } else {
        // Hapus pesan temporary jika gagal
        setMessages(prev => prev.filter(m => m.MESSAGE_ID !== tempId));
        alert('Gagal mengirim pesan');
      }
    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => prev.filter(m => m.MESSAGE_ID !== tempId));
      alert('Gagal mengirim pesan');
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.user_id;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <Avatar src={partner?.AVATAR_URL} size="md" />
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">{partner?.FULL_NAME}</h2>
          <p className="text-xs text-gray-500">@{partner?.USERNAME}</p>
        </div>
        <button className="p-2">
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <User className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p>Belum ada pesan</p>
            <p className="text-sm">Mulai percakapan dengan {partner?.FULL_NAME}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.SENDER_ID === currentUserId;
            return (
              <div key={msg.MESSAGE_ID} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'order-1' : 'order-2'}`}>
                  <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'}`}>
                    <p className="text-sm break-words">{msg.CONTENT}</p>
                    <div className={`flex justify-end items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                      {formatDateTime(msg.SENT_AT).split(' ')[1]}
                      {isMe && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
                {!isMe && (
                  <Avatar src={partner?.AVATAR_URL} size="sm" className="mr-2 order-1" />
                )}
              </div>
            );
          })
        )}
        {sendingMsg && (
          <div className="flex justify-end">
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-2xl rounded-br-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tulis pesan..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-emerald-500"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || sendingMsg}
            className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center disabled:opacity-50"
          >
            {sendingMsg ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          💡 Balas dengan sopan untuk hasil terbaik
        </p>
      </div>
    </div>
  );
};

export default ClientDirectChatView;