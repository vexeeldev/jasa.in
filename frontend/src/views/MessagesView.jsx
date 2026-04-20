import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Smile, Paperclip, CheckCheck, ChevronLeft, Send, Info, MoreHorizontal, Shield } from 'lucide-react';
import { DB_MESSAGES, CHAT_LIST, CURRENT_LOGGED_IN_USER_ID, DB_USERS } from '../data/mockDatabase';
import { formatDateTime, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';

const MessagesView = () => {
  const navigate = useNavigate();
  const [activeChatId, setActiveChatId] = useState(CHAT_LIST[0].id);
  const [messageText, setMessageText]   = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const activeChat = CHAT_LIST.find(c => c.id === activeChatId) || CHAT_LIST[0];
  const currentMessages = DB_MESSAGES.filter(msg => msg.order_id === activeChat.order.order_id);

  // Auto scroll ke pesan terbawah saat chat dibuka/diketik
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, isMobileChatOpen, currentMessages.length]);

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setIsMobileChatOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 mb-10 h-[calc(100vh-160px)] px-4 sm:px-6 lg:px-8">
      
      {/* Container Kotak Chat (Bentuk Card dengan Shadow Modern) */}
      <div className="flex h-full w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative">
        
        {/* ========================================== */}
        {/* PANEL KIRI: DAFTAR CHAT                    */}
        {/* ========================================== */}
        <div className={classNames(
          "w-full md:w-[350px] flex-shrink-0 flex-col bg-white border-r border-gray-100 z-10",
          isMobileChatOpen ? "hidden md:flex" : "flex"
        )}>
          {/* Header Inbox */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pesan</h2>
            <button className="text-gray-400 hover:text-emerald-600 transition-colors bg-gray-50 p-2 rounded-full">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="bg-gray-50 rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-sm">
              <Search className="w-4 h-4 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Cari obrolan..."
                className="w-full bg-transparent border-none focus:outline-none text-sm py-1 font-medium text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* List Kontak */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {CHAT_LIST.map((chat) => (
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
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold text-gray-900 truncate pr-2">{chat.partner.full_name}</h4>
                    <span className={classNames("text-[10px] font-bold whitespace-nowrap", chat.unread > 0 ? "text-emerald-600" : "text-gray-400")}>
                      {chat.time}
                    </span>
                  </div>
                  <p className={classNames("text-xs truncate pr-2 leading-relaxed", chat.unread > 0 ? "text-gray-900 font-bold" : "text-gray-500 font-medium")}>
                    {chat.lastMessage}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1 font-bold">ORD-{chat.order.order_id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================== */}
        {/* PANEL KANAN: AREA CHAT KHAS JASA.IN        */}
        {/* ========================================== */}
        <div className={classNames(
          "flex-1 flex-col relative w-full h-full bg-[#F8FAFC]",
          isMobileChatOpen ? "flex absolute inset-0 z-20" : "hidden md:flex"
        )}>
          
          {/* Header Kanan */}
          <div className="h-[84px] px-6 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-md z-10">
            <div className="flex items-center cursor-pointer" onClick={() => navigate(`/profile/${activeChat.partner.user_id}`)}>
              <button 
                className="md:hidden mr-3 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsMobileChatOpen(false); }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <Avatar src={activeChat.partner.avatar_url} size="md" />
              <div className="ml-4">
                <h3 className="font-black text-gray-900 text-base sm:text-lg leading-tight">{activeChat.partner.full_name}</h3>
                <div className="flex items-center mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></div>
                  <p className="text-xs text-gray-500 font-bold">Sedang aktif</p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              {/* Indikator Pesanan Jasa.in */}
              <div 
                className="hidden sm:flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors group"
                onClick={() => navigate(`/order-track/${activeChat.order.order_id}?mode=selling`)}
              >
                <Info className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 mr-3 transition-colors" />
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 group-hover:text-emerald-600 uppercase tracking-widest font-black leading-none mb-1 transition-colors">Terkait Pesanan</p>
                  <p className="text-xs font-mono font-bold text-gray-900 leading-none">ORD-{activeChat.order.order_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Area Pesan (Scrollable) */}
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar z-10 flex flex-col gap-3">
            
            {/* Banner Keamanan */}
            <div className="flex justify-center mb-6 mx-2">
              <div className="bg-[#FFFBEB] border border-[#FDE0A6] text-[#9A6A14] text-[10px] sm:text-[11px] font-bold px-4 sm:px-5 py-3 rounded-2xl shadow-sm flex items-start sm:items-center text-left sm:text-center max-w-md leading-relaxed">
                <Shield className="w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5 sm:mt-0 text-[#D99A29]" />
                <span>Percakapan dilindungi. Demi keamanan, <strong>dilarang keras</strong> melakukan atau menerima pembayaran di luar platform Jasa.in.</span>
              </div>
            </div>

            {currentMessages.length > 0 ? (
              currentMessages.map((msg) => {
                const isMe = msg.sender_id === CURRENT_LOGGED_IN_USER_ID;
                const sender = isMe ? DB_USERS[0] : activeChat.partner;
                return (
                  <div key={msg.message_id} className={classNames("flex", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                      <img src={sender.avatar_url} className="w-8 h-8 rounded-full mr-3 mt-auto mb-1 border border-gray-200 flex-shrink-0" alt="" />
                    )}
                    <div className={classNames(
                      "max-w-[85%] md:max-w-[70%] px-5 py-3.5 text-sm relative shadow-sm font-medium",
                      isMe 
                        ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm" 
                        : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-sm"
                    )}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* Waktu & Centang */}
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
              <div className="m-auto flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                  <Avatar src={activeChat.partner.avatar_url} size="md" />
                </div>
                <h4 className="font-black text-gray-900 text-lg">Mulai Percakapan</h4>
                <p className="text-sm text-gray-500 font-medium mt-1">Sapa {activeChat.partner.full_name} untuk mendiskusikan proyek.</p>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* ========================================== */}
          {/* AREA INPUT CHAT BARU (Tombol dipisah)      */}
          {/* ========================================== */}
          <div className="p-4 sm:p-6 bg-white border-t border-gray-100 z-10 flex items-end gap-3 sm:gap-4">
            
            {/* Box Teks & Icon */}
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
                placeholder="Tulis pesan..."
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
                    if (messageText.trim()) setMessageText(''); 
                  }
                }}
              />
            </div>

            {/* Tombol Kirim Terpisah di Sebelah Kanan */}
            <button 
              className={classNames(
                "p-3.5 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm",
                messageText.trim() ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transform hover:-translate-y-0.5" : "bg-gray-100 text-gray-400"
              )}
              disabled={!messageText.trim()}
              onClick={() => setMessageText('')}
            >
              <Send className={classNames("w-5 h-5", messageText.trim() ? "ml-0.5" : "")} />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default MessagesView;