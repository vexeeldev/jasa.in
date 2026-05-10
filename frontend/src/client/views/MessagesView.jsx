import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Smile, Paperclip, CheckCheck, ChevronLeft, Send, MoreHorizontal, Shield, Clock, Loader2, MessageCircle, User, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import { formatDateTime, classNames, formatCurrency } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientMessagesView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  // 🔥 State untuk chat
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatType, setActiveChatType] = useState(null);
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // State untuk daftar chat
  const [orderChats, setOrderChats] = useState([]);
  const [directChats, setDirectChats] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // Ambil semua chat
  useEffect(() => {
    fetchAllChats();
  }, []);

  // Ambil pesan saat activeChat berubah
  useEffect(() => {
    if (activeChatId && activeChatType) {
      fetchMessages();
      markAsRead();
    }
  }, [activeChatId, activeChatType]);

  // Scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto open chat jika ada state receiverId dari navigasi
  useEffect(() => {
    if (loading) return;
    
    if (state?.receiverId && !activeChatId) {
      // Cari di order chats
      const existingOrderChat = orderChats.find(c => c.OTHER_USER_ID === state.receiverId);
      if (existingOrderChat) {
        setActiveChatId(existingOrderChat.ORDER_ID);
        setActiveChatType('order');
        setActiveChatPartner(existingOrderChat);
        setIsMobileChatOpen(true);
        return;
      }
      
      // Cari di direct chats
      const existingDirectChat = directChats.find(c => c.OTHER_USER_ID === state.receiverId);
      if (existingDirectChat) {
        setActiveChatId(existingDirectChat.CHAT_ROOM_ID);
        setActiveChatType('direct');
        setActiveChatPartner(existingDirectChat);
        setIsMobileChatOpen(true);
        return;
      }
      
      // Buat direct chat baru
      createDirectChat(state.receiverId);
    }
  }, [state, orderChats, directChats, activeChatId, loading]);
  
  const fetchAllChats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const orderRes = await fetch(`${API_BASE_URL}/messages/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orderData = await orderRes.json();
      if (orderData.success) setOrderChats(orderData.data);
      
      const directRes = await fetch(`${API_BASE_URL}/messages/direct/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const directData = await directRes.json();
      if (directData.success) setDirectChats(directData.data);
      
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDirectChat = async (receiverId) => {
    if (!receiverId) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages/direct/room/${receiverId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh direct chats
        const directRes = await fetch(`${API_BASE_URL}/messages/direct/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const directData = await directRes.json();
        if (directData.success) setDirectChats(directData.data);
        
        setActiveChatId(data.data.room_id);
        setActiveChatType('direct');
        setActiveChatPartner(data.data.partner);
        setIsMobileChatOpen(true);
      }
    } catch (error) {
      console.error('Failed to create direct chat:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      let url;
      if (activeChatType === 'order') {
        url = `${API_BASE_URL}/messages/order/${activeChatId}`;
      } else {
        url = `${API_BASE_URL}/messages/direct/room/${activeChatId}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const msgs = data.data.messages || (data.data.length ? data.data : []);
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const markAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (activeChatType === 'order') {
        await fetch(`${API_BASE_URL}/messages/order/${activeChatId}/read-all`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      let url;
      let body;
      
      if (activeChatType === 'order') {
        url = `${API_BASE_URL}/messages/order/${activeChatId}`;
        body = { content: messageText };
      } else {
        url = `${API_BASE_URL}/messages/direct/room/${activeChatId}`;
        body = { content: messageText };
      }
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        await fetchMessages();
        setMessageText('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
      'in_progress': { label: 'Dikerjakan', color: 'bg-blue-100 text-blue-700' },
      'waiting_approval': { label: 'Review', color: 'bg-purple-100 text-purple-700' },
      'revision': { label: 'Revisi', color: 'bg-orange-100 text-orange-700' },
      'completed': { label: 'Selesai', color: 'bg-green-100 text-green-700' }
    };
    return statusConfig[status] || { label: 'Diproses', color: 'bg-gray-100 text-gray-700' };
  };

  const allChats = [...orderChats, ...directChats.map(c => ({ ...c, TYPE: 'direct' }))];
  
  const filteredChats = allChats.filter(chat => {
    if (activeTab === 'order' && chat.TYPE === 'direct') return false;
    if (activeTab === 'direct' && chat.TYPE !== 'direct') return false;
    return chat.OTHER_USER_NAME?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser?.user_id;

  return (
    <div className="max-w-6xl mx-auto mt-10 mb-10 h-[calc(100vh-160px)] px-4 sm:px-6 lg:px-8">
      <div className="flex h-full w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative">
        
        {/* Panel Kiri - Daftar Chat */}
        <div className={classNames(
          "w-full md:w-[380px] flex-shrink-0 flex-col bg-white border-r border-gray-100 z-10",
          isMobileChatOpen ? "hidden md:flex" : "flex"
        )}>
          <div className="px-6 py-5 border-b border-gray-100 bg-white">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pesan</h2>
            <p className="text-xs text-gray-500">Chat dengan freelancer</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-4">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'order', label: 'Pesanan' },
              { id: 'direct', label: 'Langsung' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'text-emerald-600 border-b-2 border-emerald-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="bg-gray-50 rounded-xl flex items-center px-4 py-2">
              <Search className="w-4 h-4 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Cari chat..."
                className="w-full bg-transparent focus:outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="text-center py-20">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada chat</p>
                <button 
                  onClick={() => navigate('/client/explore')}
                  className="mt-4 text-emerald-600 text-sm hover:underline"
                >
                  Cari Freelancer
                </button>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isOrderChat = chat.TYPE !== 'direct';
                const statusBadge = isOrderChat ? getOrderStatusBadge(chat.ORDER_STATUS) : null;
                const isActive = (isOrderChat && activeChatId === chat.ORDER_ID) || 
                                 (!isOrderChat && activeChatId === chat.CHAT_ROOM_ID);
                
                return (
                  <div
                    key={isOrderChat ? chat.ORDER_ID : chat.CHAT_ROOM_ID}
                    className={classNames(
                      "flex items-start px-5 py-4 cursor-pointer transition-all border-l-4",
                      isActive ? "bg-emerald-50/50 border-emerald-500" : "border-transparent hover:bg-gray-50"
                    )}
                    onClick={() => {
                      if (isOrderChat) {
                        setActiveChatId(chat.ORDER_ID);
                        setActiveChatType('order');
                      } else {
                        setActiveChatId(chat.CHAT_ROOM_ID);
                        setActiveChatType('direct');
                      }
                      setActiveChatPartner(chat);
                      setIsMobileChatOpen(true);
                      fetchMessages();
                    }}
                  >
                    <div className="flex-shrink-0 mr-4 relative">
                      <Avatar src={chat.OTHER_USER_AVATAR} size="md" />
                      {chat.UNREAD_COUNT > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 bg-red-500 rounded-full items-center justify-center">
                          <span className="text-white text-[8px] font-bold">{chat.UNREAD_COUNT}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{chat.OTHER_USER_NAME}</h4>
                        <span className="text-[10px] text-gray-400">
                          {chat.LAST_MESSAGE_TIME ? formatDateTime(chat.LAST_MESSAGE_TIME).split(' ')[1] : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {chat.LAST_MESSAGE || 'Mulai percakapan'}
                      </p>
                      {isOrderChat && (
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-gray-400">ORD-{chat.ORDER_ID}</span>
                          <span className={classNames("text-[9px] px-1.5 py-0.5 rounded-full font-bold", statusBadge?.color)}>
                            {statusBadge?.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Kanan - Area Chat */}
        {activeChatPartner ? (
          <div className={classNames(
            "flex-1 flex-col relative w-full h-full bg-[#F8FAFC]",
            isMobileChatOpen ? "flex absolute inset-0 z-20" : "hidden md:flex"
          )}>
            {/* Header dengan Info Partner */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    className="md:hidden p-1"
                    onClick={() => setIsMobileChatOpen(false)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar src={activeChatPartner.OTHER_USER_AVATAR} size="md" />
                  <div>
                    <h3 className="font-bold text-gray-900">{activeChatPartner.OTHER_USERNAME}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RatingStars rating={activeChatPartner.OTHER_USER_RATING || 0} size={12} />
                      <span className="text-xs text-gray-500">
                        {activeChatType === 'order' ? 'Via Pesanan' : 'Freelancer'}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              {/* Info Profile Button */}
              <button 
                onClick={() => navigate(`/client/profile/${activeChatPartner.OTHER_USER_ID}`)}
                className="mt-2 text-xs text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Info className="w-3 h-3" />
                Lihat profil {activeChatPartner.OTHER_USER_NAME}
              </button>
            </div>

            {/* Banner Keamanan - Peringatan Transaksi di Luar Platform */}
            <div className="px-4 pt-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-bold">⚠️ Peringatan Keamanan</p>
                  <p className="text-[11px] mt-0.5">
                    Segala bentuk transaksi di luar platform Jasa.in <span className="font-bold">TIDAK DILINDUNGI</span> oleh sistem escrow kami. 
                    Harap tetap bertransaksi di dalam platform untuk keamanan Anda.
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              <div className="flex justify-center mb-2">
                <div className="bg-blue-50 text-blue-800 text-[10px] font-bold px-3 py-1.5 rounded-full">
                  <Shield className="w-3 h-3 inline mr-1" /> Pembayaran 100% aman via escrow
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada pesan</p>
                  <p className="text-sm">Mulai percakapan dengan {activeChatPartner.OTHER_USER_NAME}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Diskusikan detail proyek Anda di sini
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.SENDER_ID === currentUserId;
                  return (
                    <div key={msg.MESSAGE_ID || msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && <Avatar src={activeChatPartner.OTHER_USER_AVATAR} size="sm" className="mr-2" />}
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'}`}>
                        {!isMe && (
                          <p className="text-[10px] font-bold text-emerald-600 mb-1">
                            {activeChatPartner.OTHER_USER_NAME}
                          </p>
                        )}
                        <p className="text-sm break-words">{msg.CONTENT || msg.content}</p>
                        <div className={`flex justify-end mt-1 text-[10px] ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                          {formatDateTime(msg.SENT_AT || msg.sent_at).split(' ')[1]}
                          {isMe && <CheckCheck className="w-3 h-3 ml-1" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {sending && (
                <div className="flex justify-end">
                  <div className="bg-emerald-600 text-white px-4 py-2 rounded-2xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tulis pesan..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-emerald-500 text-sm"
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
                  disabled={!messageText.trim() || sending}
                  className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 px-2">
                <p className="text-[10px] text-gray-400">
                  💡 Chat dengan sopan untuk hasil terbaik
                </p>
                <button className="text-[10px] text-gray-400 hover:text-emerald-600">
                  <Paperclip className="w-3 h-3 inline mr-1" /> Lampirkan file
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Empty state - belum pilih chat
          <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700">Pesan</h3>
              <p className="text-gray-500 text-sm mt-1">Pilih chat untuk memulai percakapan</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientMessagesView;