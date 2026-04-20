import React, { useState } from 'react';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, Plus, 
  Clock, Search, Filter, CheckCircle, CreditCard, FileText,
  Eye, EyeOff
} from 'lucide-react';
import { formatCurrency, formatDate, classNames } from '../data/helpers';

// ============================================================================
// MOCK DATA TERPADU 
// ============================================================================

const MOCK_DATA = {
  current_balance: 15250000,
  pending_escrow: 2000000,
  total_earned: 45000000,
  
  transactions: [
    { id: 'ORD-101', type: 'in', amount: 3150000, date: '2026-03-18T14:20:00Z', title: 'Pencairan Dana Jasa', label: 'Earning', status: 'success' },
    { id: 'TP-502', type: 'in', amount: 1000000, date: '2026-04-12T10:00:00Z', title: 'Top Up via GoPay', label: 'Deposit', status: 'success' },
    { id: 'WD-01', type: 'out', amount: 500000, date: '2026-03-20T08:00:00Z', title: 'Penarikan ke BCA', label: 'Withdraw', status: 'success' },
    { id: 'ORD-205', type: 'out', amount: 250000, date: '2026-04-05T15:00:00Z', title: 'Pembayaran Jasa', label: 'Purchase', status: 'success' },
    { id: 'WD-02', type: 'out', amount: 1500000, date: '2026-04-14T09:00:00Z', title: 'Penarikan ke Mandiri', label: 'Withdraw', status: 'pending' },
  ]
};

const WalletView = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showBalance, setShowBalance] = useState(true);

  const sortedTransactions = [...MOCK_DATA.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredLedger = sortedTransactions.filter(trx => {
    if (activeTab === 'all') return true;
    return trx.type === activeTab;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white min-h-screen">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Keuangan Saya</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Kelola saldo, isi ulang, dan tarik pendapatan Anda.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowUpRight className="w-4 h-4 mr-2" /> Tarik Dana
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Top Up Saldo
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        
        {/* Main Balance Card - Angka Diperbesar & Dinaikkan */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col min-h-[220px]">
          <div className="flex justify-between items-start mb-4"> {/* Margin diperkecil dari mb-6 ke mb-4 */}
            <div className="flex items-center text-gray-500">
              <Wallet className="w-5 h-5 mr-2" />
              <span className="text-xs font-bold uppercase tracking-widest">Saldo Aktif Jasa.in</span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center shadow-sm">
              <CheckCircle className="w-3 h-3 mr-1" /> Verified
            </span>
          </div>
          
          <div className="flex-grow flex flex-col justify-start pt-2"> {/* pt-2 agar angka lebih naik */}
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter truncate leading-tight">
                {showBalance ? formatCurrency(MOCK_DATA.current_balance) : 'Rp •••••••••'}
              </h2>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none flex-shrink-0"
                title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
              >
                {showBalance ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
              </button>
            </div>
            <p className="text-sm mt-10 text-gray-500 font-medium">
              Bisa digunakan untuk belanja jasa atau ditarik ke rekening bank pribadi.
            </p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center flex-1">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dana Tertahan</p>
              <h3 className="text-2xl font-black text-gray-900 truncate">
                {showBalance ? formatCurrency(MOCK_DATA.pending_escrow) : 'Rp •••••••'}
              </h3>
            </div>
            <div className="flex items-center text-[10px] text-orange-600 font-bold mt-3 bg-orange-50 w-max px-2 py-0.5 rounded">
              <Clock className="w-3 h-3 mr-1" /> Pekerjaan Berlangsung
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center flex-1">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Earned</p>
              <h3 className="text-2xl font-black text-gray-900 truncate">
                {showBalance ? formatCurrency(MOCK_DATA.total_earned) : 'Rp •••••••'}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-wider">Akumulasi Seumur Hidup</p>
          </div>
        </div>
      </div>

      {/* 3. TRANSACTION HISTORY */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="font-bold text-gray-900 text-lg">Mutasi Transaksi</h3>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari ID ref..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-2 border-b border-gray-100 flex gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'in', label: 'Uang Masuk (+)' },
            { id: 'out', label: 'Uang Keluar (-)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                "px-4 py-2 text-sm font-bold rounded-full transition-colors whitespace-nowrap",
                activeTab === tab.id ? "bg-gray-900 text-white" : "bg-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-100">
          {filteredLedger.map((trx) => (
            <div key={trx.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors group">
              <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 flex-shrink-0">
                  {trx.type === 'in' ? (
                    trx.label === 'Deposit' ? <Plus className="w-5 h-5 text-blue-500" /> : <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                  ) : (
                    trx.label === 'Withdraw' ? <ArrowUpRight className="w-5 h-5 text-gray-700" /> : <CreditCard className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm md:text-base">{trx.title}</h4>
                  <div className="flex items-center mt-1 text-[11px] text-gray-500 font-medium">
                    <span>{formatDate(trx.date)}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{trx.id}</span>
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
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                    trx.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {trx.status}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredLedger.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-gray-50/30">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-bold text-gray-900">Belum ada mutasi</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Transaksi Anda akan muncul di sini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletView;