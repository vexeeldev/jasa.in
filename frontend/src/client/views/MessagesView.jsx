import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Smile, Paperclip, CheckCheck, ChevronLeft, Send, Info, MoreHorizontal, Shield, Clock, AlertCircle } from 'lucide-react';
import { DB_MESSAGES, CHAT_LIST, CURRENT_LOGGED_IN_USER_ID, DB_USERS } from '../data/mockDatabase';
import { formatDateTime, classNames, formatCurrency } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';

const ClientMessagesView = () => {
  const navigate = useNavigate();
  // Untuk client, chat list berdasarkan pesanan yang dia buat
  const [activeChatId, setActiveChatId] = useState(CHAT_LIST[0]?.id);
  const [messageText, setMessageText] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Filter chat list berdasarkan search
  const filteredChats = CHAT_LIST.filter(chat => 
    chat.partner.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.order.order_id.toString().includes(searchQuery)
  );

  const activeChat = filteredChats.find(c => c.id === activeChatId) || filteredChats[0];
  
  // Untuk client, ambil pesan berdasarkan order_id
  const currentMessages = DB_MESSAGES.filter(msg => msg.order_id === activeChat?.order?.order_id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, isMobileChatOpen, currentMessages.length]);

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setIsMobileChatOpen(true);
  };

  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      'in_progress': { label: 'Sedang Dikerjakan', color: 'bg-blue-100 text-blue-700' },
      'waiting_approval': { label: 'Menunggu Persetujuan', color: 'bg-yellow-100 text-yellow-700' },
      'completed': { label: 'Selesai', color: 'bg-green-100 text-green-700' },
      'revision': { label: 'Revisi', color: 'bg-orange-100 text-orange-700' },
      'dispute': { label: 'Sengketa', color: 'bg-red-100 text-red-700' }
    };
    return statusConfig[status] || { label: 'Diproses', color: 'bg-gray-100 text-gray-700' };
  };

  if (!activeChat) {
    return (
      <div className="max-w-6xl mx-auto mt-10 mb-10 h-[calc(100vh-160px)] px-4 sm:px-6 lg:px-8">
        <div className="flex h-full w-full bg-white rounded-3xl shadow-xl border border-gray-200 items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Pesan</h3>
            <p className="text-gray-500">Mulai pesan jasa untuk berkomunikasi dengan freelancer</p>
            <button 
              onClick={() => navigate('/client/explore')}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
            >
              Cari Jasa Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const orderStatus = getOrderStatusBadge(activeChat.order?.status || 'in_progress');

  return (
    <div className="max-w-6xl mx-auto mt-10 mb-10 h-[calc(100vh-160px)] px-4 sm:px-6 lg:px-8">
      
      <div className="flex h-full w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative">
        
        {/* ========================================== */}
        {/* PANEL KIRI: DAFTAR PESANAN CLIENT          */}
        {/* ========================================== */}
        <div className={classNames(
          "w-full md:w-[380px] flex-shrink-0 flex-col bg-white border-r border-gray-100 z-10",
          isMobileChatOpen ? "hidden md:flex" : "flex"
        )}>
          {/* Header Inbox */}
          <div className="px-6 py-5 border-b border-gray-100 bg-white">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Pesan & Pesanan</h2>
            <p className="text-xs text-gray-500">Komunikasikan dengan freelancer Anda</p>
          </div>

          {/* Search Bar */}
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="bg-gray-50 rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-sm">
              <Search className="w-4 h-4 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Cari pesanan atau freelancer..."
                className="w-full bg-transparent border-none focus:outline-none text-sm py-1 font-medium text-gray-900 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* List Chat/Pesanan Client */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {filteredChats.map((chat) => {
              const statusBadge = getOrderStatusBadge(chat.order?.status);
              return (
                <div
                  key={chat.id}
                  className={classNames(
                    "flex items-start px-5 py-4 cursor-pointer transition-all border-l-4",
                    activeChatId === chat.id ? "bg-emerald-50/50 border-emerald-500" : "border-transparent hover:bg-gray-50"
                  )}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="flex-shrink-0 mr-4 relative">
                    <Avatar src={chat.partner.avatar_url} size="md" />
                    {chat.unread > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 bg-red-500 rounded-full items-center justify-center">
                        <span className="text-white text-[8px] font-bold">{chat.unread}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-sm font-bold text-gray-900 truncate pr-2">{chat.partner.full_name}</h4>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                        {chat.time}
                      </span>
                    </div>
                    <p className={classNames(
                      "text-xs truncate pr-2 leading-relaxed",
                      chat.unread > 0 ? "text-gray-900 font-bold" : "text-gray-500 font-medium"
                    )}>
                      {chat.lastMessage}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400 font-mono font-bold">
                        ORD-{chat.order?.order_id}
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

        {/* ========================================== */}
        {/* PANEL KANAN: AREA CHAT                     */}
        {/* ========================================== */}
        <div className={classNames(
          "flex-1 flex-col relative w-full h-full bg-[#F8FAFC]",
          isMobileChatOpen ? "flex absolute inset-0 z-20" : "hidden md:flex"
        )}>
          
          {/* Header Kanan - dengan Info Order Client */}
          <div className="h-auto px-6 py-4 flex flex-col border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center cursor-pointer" onClick={() => navigate(`/client/order-track/${activeChat.order?.order_id}`)}>
                <button 
                  className="md:hidden mr-3 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); setIsMobileChatOpen(false); }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <Avatar src={activeChat.partner.avatar_url} size="md" />
                <div className="ml-4">
                  <h3 className="font-black text-gray-900 text-base sm:text-lg leading-tight">{activeChat.partner.full_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RatingStars rating={activeChat.partner.rating || 4.5} size={12} />
                    <span className="text-xs text-gray-500">Freelancer</span>
                  </div>
                </div>
              </div>

              <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors bg-gray-50 rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary Card - Client View */}
            <div 
              className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/client/order-track/${activeChat.order?.order_id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Detail Pesanan
                  </p>
                  <p className="text-sm font-bold text-gray-900">{activeChat.order?.service_title || 'Layanan Jasa'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-semibold text-emerald-600">
                      {formatCurrency(activeChat.order?.total_price || 0)}
                    </span>
                    <span className={classNames("text-[10px] px-2 py-0.5 rounded-full font-bold", orderStatus.color)}>
                      {orderStatus.label}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Estimasi</p>
                  <p className="text-xs font-bold text-gray-700 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {activeChat.order?.delivery_date || '5 hari lagi'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Area Pesan */}
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            
            {/* Banner Keamanan - Client Version */}
            <div className="flex justify-center mb-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] sm:text-[11px] font-bold px-4 sm:px-5 py-3 rounded-2xl shadow-sm flex items-start sm:items-center max-w-md leading-relaxed">
                <Shield className="w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5 sm:mt-0 text-blue-600" />
                <span>✅ <strong>Pembayaran 100% aman</strong> — Dana ditahan oleh Jasa.in hingga Anda menyetujui hasil pekerjaan.</span>
              </div>
            </div>

            {currentMessages.length > 0 ? (
              currentMessages.map((msg) => {
                const isMe = msg.sender_id === CURRENT_LOGGED_IN_USER_ID;
                const sender = isMe ? DB_USERS[0] : activeChat.partner;
                return (
                  <div key={msg.message_id} className={classNames("flex", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                      <img 
                        src={sender.avatar_url} 
                        className="w-8 h-8 rounded-full mr-3 mt-auto mb-1 border border-gray-200 flex-shrink-0" 
                        alt="avatar"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/32'; }}
                      />
                    )}
                    <div className={classNames(
                      "max-w-[85%] md:max-w-[70%] px-5 py-3.5 text-sm relative shadow-sm font-medium",
                      isMe 
                        ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm" 
                        : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-sm"
                    )}>
                      {!isMe && (
                        <p className="text-[9px] font-bold text-emerald-600 mb-1 -mt-1">
                          {sender.full_name}
                        </p>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      
                      <div className={classNames(
                        "flex items-center justify-end mt-2 text-[10px] font-bold",
                        isMe ? "text-emerald-200" : "text-gray-400"
                      )}>
                        <span className="mr-1.5">{formatDateTime(msg.sent_at).split(' ')[1]}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="m-auto flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-4 border border-gray-100">
                  <Avatar src={activeChat.partner.avatar_url} size="lg" />
                </div>
                <h4 className="font-black text-gray-900 text-lg mb-1">Mulai Percakapan</h4>
                <p className="text-sm text-gray-500 font-medium max-w-xs">
                  Sapa {activeChat.partner.full_name} untuk mendiskusikan detail pengerjaan proyek Anda
                </p>
                <div className="mt-6 flex gap-2">
                  <button 
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg"
                    onClick={() => {
                      setMessageText('Halo, saya ingin mendiskusikan proyek ini');
                    }}
                  >
                    Kirim Salam
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Area Input Chat */}
          <div className="p-4 sm:p-6 bg-white border-t border-gray-100 z-10 flex items-end gap-3 sm:gap-4">
            
            <div className="flex-1 bg-gray-50 rounded-3xl flex items-end border border-gray-200 focus-within:border-emerald-500 focus-within:bg-white shadow-sm transition-all overflow-hidden pr-2">
              
              <div className="flex pb-2 px-2">
                <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none rounded-xl hover:bg-emerald-50">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none rounded-xl hover:bg-emerald-50">
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              
              <textarea
                rows="1"
                placeholder="Tulis pesan ke freelancer..."
                className="flex-1 bg-transparent px-2 py-3.5 text-sm focus:outline-none resize-none font-medium max-h-32 custom-scrollbar text-gray-900 placeholder-gray-400"
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = (e.target.scrollHeight) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (messageText.trim()) {
                      // TODO: Send message logic
                      setMessageText('');
                    }
                  }
                }}
              />
            </div>

            <button 
              className={classNames(
                "p-3.5 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm",
                messageText.trim() ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transform hover:-translate-y-0.5" : "bg-gray-100 text-gray-400"
              )}
              disabled={!messageText.trim()}
              onClick={() => {
                if (messageText.trim()) {
                  // TODO: Send message logic
                  setMessageText('');
                }
              }}
            >
              <Send className={classNames("w-5 h-5", messageText.trim() ? "ml-0.5" : "")} />
            </button>
          </div>

          {/* Tips for Client */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
              💡 <strong>Tips:</strong> Diskusikan detail proyek dengan jelas agar freelancer dapat memberikan hasil terbaik
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Temporary component for empty state
const MessageSquare = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export default ClientMessagesView;