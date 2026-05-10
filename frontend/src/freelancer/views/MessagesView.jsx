import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Smile, Paperclip, CheckCheck, ChevronLeft, Send, MoreHorizontal, Shield, Clock, Loader2 } from 'lucide-react';
import { formatDateTime, classNames, formatCurrency } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';
import Button from '../components/ui/Button';

const API_BASE_URL = 'http://localhost:5000/api';

const FreelancerMessagesView = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Ambil daftar chat
  useEffect(() => {
    fetchChats();
  }, []);

  // Ambil pesan saat activeChat berubah
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      markAsRead(activeChatId);
    }
  }, [activeChatId]);

  // Scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChats(data.data);
        if (data.data.length > 0 && !activeChatId) {
          setActiveChatId(data.data[0].ORDER_ID);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages/order/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const markAsRead = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/messages/order/${orderId}/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages/order/${activeChatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: messageText })
      });
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setMessageText('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Gagal mengirim pesan');
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

  const activeChat = chats.find(c => c.ORDER_ID === activeChatId);
  const filteredChats = chats.filter(chat => 
    chat.OTHER_USER_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.ORDER_ID?.toString().includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!activeChat && chats.length === 0) {
    return (
      <div className="max-w-6xl mx-auto mt-10 mb-10 h-[calc(100vh-160px)] px-4 sm:px-6 lg:px-8">
        <div className="flex h-full w-full bg-white rounded-3xl shadow-xl border border-gray-200 items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Pesan</h3>
            <p className="text-gray-500">Pesan akan muncul saat ada yang menghubungi Anda</p>
          </div>
        </div>
      </div>
    );
  }

  const orderStatus = getOrderStatusBadge(activeChat?.ORDER_STATUS);

  return (
    <div className="max-w-6xl mx-auto mt-10 mb-10 h-[calc(100vh-160px)] px-4 sm:px-6 lg:px-8">
      
      <div className="flex h-full w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative">
        
        {/* Panel Kiri: Daftar Chat */}
        <div className={classNames(
          "w-full md:w-[380px] flex-shrink-0 flex-col bg-white border-r border-gray-100 z-10",
          isMobileChatOpen ? "hidden md:flex" : "flex"
        )}>
          <div className="px-6 py-5 border-b border-gray-100 bg-white">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Pesan Masuk</h2>
            <p className="text-xs text-gray-500">Komunikasikan dengan client Anda</p>
          </div>

          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="bg-gray-50 rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-sm">
              <Search className="w-4 h-4 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Cari pesanan atau client..."
                className="w-full bg-transparent border-none focus:outline-none text-sm py-1 font-medium text-gray-900 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {filteredChats.map((chat) => {
              const statusBadge = getOrderStatusBadge(chat.ORDER_STATUS);
              const isActive = activeChatId === chat.ORDER_ID;
              return (
                <div
                  key={chat.ORDER_ID}
                  className={classNames(
                    "flex items-start px-5 py-4 cursor-pointer transition-all border-l-4",
                    isActive ? "bg-emerald-50/50 border-emerald-500" : "border-transparent hover:bg-gray-50"
                  )}
                  onClick={() => {
                    setActiveChatId(chat.ORDER_ID);
                    setIsMobileChatOpen(true);
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
                      <h4 className="text-sm font-bold text-gray-900 truncate pr-2">{chat.OTHER_USER_NAME}</h4>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                        {chat.LAST_MESSAGE_TIME ? formatDateTime(chat.LAST_MESSAGE_TIME).split(' ')[1] : ''}
                      </span>
                    </div>
                    <p className={classNames(
                      "text-xs truncate pr-2 leading-relaxed",
                      chat.UNREAD_COUNT > 0 ? "text-gray-900 font-bold" : "text-gray-500 font-medium"
                    )}>
                      {chat.LAST_MESSAGE || 'Mulai percakapan'}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400 font-mono font-bold">
                        ORD-{chat.ORDER_ID}
                      </span>
                      <span className={classNames("text-[9px] px-1.5 py-0.5 rounded-full font-bold", statusBadge.color)}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Kanan: Area Chat */}
        {activeChat && (
          <div className={classNames(
            "flex-1 flex-col relative w-full h-full bg-[#F8FAFC]",
            isMobileChatOpen ? "flex absolute inset-0 z-20" : "hidden md:flex"
          )}>
            
            {/* Header */}
            <div className="h-auto px-6 py-4 flex flex-col border-b border-gray-200 bg-white/80 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center cursor-pointer" onClick={() => navigate(`/freelancer/order-track/${activeChat.ORDER_ID}`)}>
                  <button 
                    className="md:hidden mr-3 p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                    onClick={(e) => { e.stopPropagation(); setIsMobileChatOpen(false); }}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <Avatar src={activeChat.OTHER_USER_AVATAR} size="md" />
                  <div className="ml-4">
                    <h3 className="font-black text-gray-900 text-base">{activeChat.OTHER_USER_NAME}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RatingStars rating={activeChat.OTHER_USER_RATING || 0} size={12} />
                      <span className="text-xs text-gray-500">Client</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-emerald-600 bg-gray-50 rounded-full">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Order Summary */}
              <div 
                className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 cursor-pointer hover:shadow-md"
                onClick={() => navigate(`/freelancer/order-track/${activeChat.ORDER_ID}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Detail Pesanan</p>
                    <p className="text-sm font-bold text-gray-900">{activeChat.SERVICE_TITLE || 'Layanan Jasa'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-semibold text-emerald-600">
                        {formatCurrency(activeChat.TOTAL_PRICE || 0)}
                      </span>
                      <span className={classNames("text-[10px] px-2 py-0.5 rounded-full font-bold", orderStatus.color)}>
                        {orderStatus.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">Estimasi</p>
                    <p className="text-xs font-bold text-gray-700">5 hari lagi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-3">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold px-4 py-2 rounded-2xl">
                  <Shield className="w-3 h-3 inline mr-1" /> Pembayaran dijamin aman oleh sistem escrow
                </div>
              </div>

              {messages.length > 0 ? (
                messages.map((msg) => {
                  const currentUserId = JSON.parse(localStorage.getItem('user'))?.user_id;
                  const isMe = msg.SENDER_ID === currentUserId;
                  return (
                    <div key={msg.MESSAGE_ID} className={classNames("flex", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && (
                        <img src={activeChat.OTHER_USER_AVATAR} className="w-8 h-8 rounded-full mr-3" alt="" />
                      )}
                      <div className={classNames(
                        "max-w-[70%] px-4 py-2.5 text-sm relative shadow-sm",
                        isMe 
                          ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm" 
                          : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-sm"
                      )}>
                        {!isMe && <p className="text-[10px] font-bold text-emerald-600 mb-0.5">{activeChat.OTHER_USER_NAME}</p>}
                        <p className="leading-relaxed break-words">{msg.CONTENT}</p>
                        <div className={classNames("flex justify-end mt-1 text-[10px]", isMe ? "text-emerald-200" : "text-gray-400")}>
                          {formatDateTime(msg.SENT_AT).split(' ')[1]}
                          {isMe && <CheckCheck className="w-3.5 h-3.5 ml-1" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="m-auto text-center">
                  <Avatar src={activeChat.OTHER_USER_AVATAR} size="lg" className="mx-auto mb-4" />
                  <p className="text-gray-500">Mulai percakapan dengan {activeChat.OTHER_USER_NAME}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-end gap-3">
              <div className="flex-1 bg-gray-50 rounded-2xl flex items-end border border-gray-200 focus-within:border-emerald-500">
                <button className="p-2 text-gray-400 hover:text-emerald-600">
                  <Smile className="w-5 h-5" />
                </button>
                <textarea
                  rows="1"
                  placeholder="Tulis pesan ke client..."
                  className="flex-1 bg-transparent py-3 text-sm focus:outline-none resize-none max-h-32"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button className="p-2 text-gray-400 hover:text-emerald-600">
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={sendMessage}
                disabled={!messageText.trim() || sending}
                className="p-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>

            <div className="px-6 py-2 bg-gray-50 border-t text-center">
              <p className="text-[10px] text-gray-400">💡 Respons cepat untuk kepuasan client</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageSquare = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export default FreelancerMessagesView;