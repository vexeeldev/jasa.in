import React, { useState } from 'react';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, Plus, 
  Clock, Search, Filter, CheckCircle, CreditCard, FileText,
  Eye, EyeOff, ShoppingBag, History, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate, classNames } from '../data/helpers';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// ============================================================================
// MOCK DATA CLIENT VERSION
// ============================================================================

const MOCK_DATA_CLIENT = {
  current_balance: 8750000,
  pending_escrow: 3150000, // Dana ditahan untuk pesanan aktif
  total_spent: 12500000,   // Total belanja seumur hidup
  
  transactions: [
    { id: 'TP-001', type: 'in', amount: 5000000, date: '2026-04-15T10:30:00Z', title: 'Top Up Saldo', method: 'BCA Transfer', status: 'success' },
    { id: 'TP-002', type: 'in', amount: 2000000, date: '2026-04-10T14:20:00Z', title: 'Top Up Saldo', method: 'GoPay', status: 'success' },
    { id: 'ORD-901', type: 'out', amount: 3150000, date: '2026-04-12T09:15:00Z', title: 'Pembelian Jasa', service: 'Desain Logo Premium', status: 'pending' },
    { id: 'ORD-902', type: 'out', amount: 1250000, date: '2026-04-05T16:45:00Z', title: 'Pembelian Jasa', service: 'Website Company Profile', status: 'success' },
    { id: 'ORD-903', type: 'out', amount: 850000, date: '2026-03-28T11:00:00Z', title: 'Pembelian Jasa', service: 'Video Animasi 2D', status: 'success' },
    { id: 'REF-001', type: 'in', amount: 250000, date: '2026-03-20T08:00:00Z', title: 'Refund Pesanan', service: 'SEO Article', status: 'success' },
  ]
};

const ClientWalletView = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showBalance, setShowBalance] = useState(true);

  const sortedTransactions = [...MOCK_DATA_CLIENT.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredLedger = sortedTransactions.filter(trx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in') return trx.type === 'in';
    if (activeTab === 'out') return trx.type === 'out';
    return true;
  });

  const handleTopUp = () => {
    // TODO: Open top up modal
    alert('Fitur Top Up akan segera hadir');
  };

  const handleWithdraw = () => {
    // TODO: Open withdraw modal (untuk refund/komisi)
    alert('Penarikan dana hanya untuk refund atau komisi affiliate');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dompet Saya</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Kelola saldo untuk pembelian jasa freelance
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none"
            onClick={handleWithdraw}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" /> 
            Tarik Dana
          </Button>
          <Button 
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700"
            onClick={handleTopUp}
          >
            <Plus className="w-4 h-4 mr-2" /> 
            Top Up Saldo
          </Button>
        </div>
      </div>

      {/* Summary Metrics - Client Version */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        
        {/* Main Balance Card */}
        <Card className="md:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Wallet className="w-5 h-5 mr-2 opacity-80" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                Saldo Tersedia
              </span>
            </div>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none"
              title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="mb-4">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
              {showBalance ? formatCurrency(MOCK_DATA_CLIENT.current_balance) : 'Rp •••••••••'}
            </h2>
          </div>
          
          <p className="text-sm text-white/80">
            Siap digunakan untuk membeli jasa freelance
          </p>
        </Card>

        {/* Secondary Metrics - Client Specific */}
        <div className="flex flex-col gap-5">
          <Card className="bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Dana Ditahan
                </p>
                <h3 className="text-2xl font-black text-gray-900">
                  {showBalance ? formatCurrency(MOCK_DATA_CLIENT.pending_escrow) : 'Rp •••••••'}
                </h3>
                <div className="flex items-center text-[10px] text-orange-600 font-bold mt-2 bg-orange-50 w-max px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3 mr-1" /> 
                  Menunggu Persetujuan
                </div>
              </div>
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
          </Card>
          
          <Card className="bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Total Belanja
                </p>
                <h3 className="text-2xl font-black text-gray-900">
                  {showBalance ? formatCurrency(MOCK_DATA_CLIENT.total_spent) : 'Rp •••••••'}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wider">
                  Seumur Hidup
                </p>
              </div>
              <ShoppingBag className="w-5 h-5 text-emerald-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* How Escrow Works - Client Education */}
      <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Bagaimana Dana Ditahan?</h4>
            <p className="text-xs text-gray-600 mt-1">
              Saat Anda memesan jasa, dana akan ditahan oleh Jasa.in. Dana baru akan dicairkan ke freelancer 
              setelah Anda menyetujui hasil pekerjaan. Jika ada masalah, Anda bisa meminta refund.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="font-black text-gray-900 text-lg flex items-center">
            <History className="w-5 h-5 mr-2 text-emerald-500" />
            Riwayat Transaksi
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari transaksi..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs - Client Version */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto custom-scrollbar bg-gray-50">
          {[
            { id: 'all', label: 'Semua Transaksi' },
            { id: 'in', label: 'Top Up & Refund (+)' },
            { id: 'out', label: 'Pembelian (-)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                "px-4 py-1.5 text-sm font-bold rounded-full transition-colors whitespace-nowrap",
                activeTab === tab.id ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="divide-y divide-gray-100">
          {filteredLedger.length > 0 ? (
            filteredLedger.map((trx, idx) => (
              <div key={idx} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                  <div className={classNames(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    trx.type === 'in' 
                      ? "bg-emerald-50 border border-emerald-100" 
                      : "bg-gray-50 border border-gray-100"
                  )}>
                    {trx.type === 'in' ? (
                      trx.title === 'Refund Pesanan' ? 
                        <ArrowDownLeft className="w-5 h-5 text-orange-500" /> : 
                        <Plus className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-gray-700" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm md:text-base">{trx.title}</h4>
                    {trx.service && (
                      <p className="text-xs text-gray-500 mt-0.5">{trx.service}</p>
                    )}
                    {trx.method && (
                      <p className="text-xs text-gray-400 mt-0.5">via {trx.method}</p>
                    )}
                    <div className="flex items-center mt-1 text-[10px] text-gray-400 font-medium">
                      <span>{formatDate(trx.date)}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="font-mono">{trx.id}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto pl-14 sm:pl-0 mt-3 sm:mt-0">
                  <p className={classNames(
                    "font-black text-base md:text-lg",
                    trx.type === 'in' ? "text-emerald-600" : "text-gray-900"
                  )}>
                    {trx.type === 'in' ? '+' : '-'}
                    {showBalance ? formatCurrency(trx.amount) : 'Rp •••••••'}
                  </p>
                  <div className="flex sm:justify-end mt-1">
                    <span className={classNames(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                      trx.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"
                    )}>
                      {trx.status === 'success' ? 'Selesai' : 'Proses'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-bold text-gray-900">Belum ada transaksi</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Top up saldo untuk mulai membeli jasa</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleTopUp}
              >
                <Plus className="w-4 h-4 mr-2" />
                Top Up Sekarang
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => window.location.href = '/client/orders'}
          className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition-all group"
        >
          <ShoppingBag className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-emerald-500" />
          <p className="text-xs font-bold text-gray-600">Pesanan Saya</p>
        </button>
        <button 
          onClick={() => window.location.href = '/client/messages'}
          className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition-all group"
        >
          <MessageCircle className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-emerald-500" />
          <p className="text-xs font-bold text-gray-600">Pesan</p>
        </button>
        <button 
          onClick={handleTopUp}
          className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition-all group"
        >
          <CreditCard className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-emerald-500" />
          <p className="text-xs font-bold text-gray-600">Top Up</p>
        </button>
        <button 
          onClick={() => window.location.href = '/client/settings'}
          className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition-all group"
        >
          <Settings className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-emerald-500" />
          <p className="text-xs font-bold text-gray-600">Pengaturan</p>
        </button>
      </div>
    </div>
  );
};

// Additional icons
const Shield = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const MessageCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Settings = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default ClientWalletView;