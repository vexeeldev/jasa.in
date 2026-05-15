import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, Plus, 
  Clock, Search, Filter, CheckCircle, CreditCard, FileText,
  Eye, EyeOff, ShoppingBag, History, AlertCircle, Loader2
} from 'lucide-react';
import { formatCurrency, formatDate, classNames } from '../data/helpers';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientWalletView = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState({
    balance: 0,
    pending_escrow: 0,
    total_spent: 0,
    transactions: []
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWalletData(prev => ({
          ...prev,
          balance: data.data.balance || 0,
          pending_escrow: data.data.pending_escrow || 0,
          total_spent: data.data.total_spent || 0
        }));
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/wallet/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWalletData(prev => ({
          ...prev,
          transactions: data.data || []
        }));
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = () => {
    navigate('/client/topup');
  };

  const handleWithdraw = () => {
    alert('Fitur penarikan dana akan segera hadir');
  };

  // Filter transactions berdasarkan tab dan search
  const filteredTransactions = walletData.transactions
    .filter(trx => {
      if (activeTab === 'all') return true;
      if (activeTab === 'in') return trx.TYPE === 'credit';
      if (activeTab === 'out') return trx.TYPE === 'debit';
      return true;
    })
    .filter(trx => {
      if (!searchTerm) return true;
      const title = trx.REFERENCE_TYPE === 'topup' ? 'Top Up Saldo' :
                    trx.REFERENCE_TYPE === 'refund' ? 'Refund Pesanan' :
                    trx.REFERENCE_TYPE === 'order' ? 'Pembelian Jasa' : '';
      return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             String(trx.TRANSACTION_ID).includes(searchTerm);
    })
    .sort((a, b) => new Date(b.CREATED_AT) - new Date(a.CREATED_AT));

  const Shield = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

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

      {/* Summary Metrics */}
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
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="mb-4">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
              {showBalance ? formatCurrency(walletData.balance) : 'Rp •••••••••'}
            </h2>
          </div>
          
          <p className="text-sm text-white/80">
            Siap digunakan untuk membeli jasa freelance
          </p>
        </Card>

        {/* Secondary Metrics */}
        <div className="flex flex-col gap-5">
          <Card className="bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Dana Ditahan
                </p>
                <h3 className="text-2xl font-black text-gray-900">
                  {showBalance ? formatCurrency(walletData.pending_escrow) : 'Rp •••••••'}
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
                  {showBalance ? formatCurrency(walletData.total_spent) : 'Rp •••••••'}
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

      {/* How Escrow Works */}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto bg-gray-50">
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
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((trx, idx) => {
              const isCredit = trx.TYPE === 'credit';
              const isRefund = trx.REFERENCE_TYPE === 'refund';
              
              // 🔥 AMAN: Konversi ID ke string terlebih dahulu
              const transactionId = String(trx.TRANSACTION_ID || trx.ID || '');
              const shortId = transactionId.length > 8 ? transactionId.slice(-8) : transactionId;
              
              // Tentukan title transaksi
              let title = '';
              if (trx.REFERENCE_TYPE === 'topup') title = 'Top Up Saldo';
              else if (trx.REFERENCE_TYPE === 'refund') title = 'Refund Pesanan';
              else if (trx.REFERENCE_TYPE === 'order') title = 'Pembelian Jasa';
              else if (trx.REFERENCE_TYPE === 'order_completed') title = 'Pembayaran Freelancer';
              else if (trx.REFERENCE_TYPE === 'auto_refund') title = 'Auto Refund - Order Expired';
              else title = trx.TITLE || 'Transaksi';
              
              return (
                <div key={idx} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                    <div className={classNames(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isCredit ? "bg-emerald-50 border border-emerald-100" : "bg-gray-50 border border-gray-100"
                    )}>
                      {isCredit ? (
                        isRefund ? 
                          <ArrowDownLeft className="w-5 h-5 text-orange-500" /> : 
                          <Plus className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-gray-700" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm md:text-base">{title}</h4>
                      <div className="flex items-center mt-1 text-[10px] text-gray-400 font-medium">
                        <span>{formatDate(trx.CREATED_AT)}</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="font-mono">#{shortId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto pl-14 sm:pl-0 mt-3 sm:mt-0">
                    <p className={classNames(
                      "font-black text-base md:text-lg",
                      isCredit ? "text-emerald-600" : "text-gray-900"
                    )}>
                      {isCredit ? '+' : '-'}
                      {showBalance ? formatCurrency(trx.AMOUNT) : 'Rp •••••••'}
                    </p>
                    <div className="flex sm:justify-end mt-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
                        Selesai
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
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
          onClick={() => navigate('/client/orders')}
          className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition-all group"
        >
          <ShoppingBag className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-emerald-500" />
          <p className="text-xs font-bold text-gray-600">Pesanan Saya</p>
        </button>
        <button 
          onClick={() => navigate('/client/messages')}
          className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition-all group"
        >
          <svg className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
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
          onClick={() => navigate('/client/settings')}
          className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition-all group"
        >
          <svg className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs font-bold text-gray-600">Pengaturan</p>
        </button>
      </div>
    </div>
  );
};

export default ClientWalletView;