import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, Plus, 
  Clock, Search, Filter, CheckCircle, CreditCard, FileText,
  Eye, EyeOff, Loader2
} from 'lucide-react';
import { formatCurrency, formatDate, classNames } from '../data/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_BASE_URL = 'http://localhost:5000/api';

const WalletView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [pendingEscrow, setPendingEscrow] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showBalance, setShowBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer');
  const [isProcessing, setIsProcessing] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isFreelancer = user.role === 'freelancer';

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payments/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.data.balance || 0);
        setPendingEscrow(data.data.pending_escrow || 0);
        setTotalEarned(data.data.total_earned || 0);
        setTotalSpent(data.data.total_spent || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payments/transactions?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);
    if (!amount || amount < 10000) {
      alert('Minimal top up Rp 10.000');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payments/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          payment_method: selectedPaymentMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Top up berhasil!');
        setShowTopUpModal(false);
        setTopUpAmount('');
        fetchBalance();
        fetchTransactions();
      } else {
        alert(data.message || 'Gagal top up');
      }
    } catch (error) {
      console.error('Top up error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = () => {
    navigate('/client/withdraw');
  };

  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.CREATED_AT) - new Date(a.CREATED_AT)
  );

  const filteredTransactions = sortedTransactions.filter(trx => {
    if (activeTab !== 'all' && trx.TYPE !== activeTab) return false;
    if (searchQuery && !trx.REFERENCE_ID?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Keuangan Saya</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {isFreelancer ? 'Kelola pendapatan dan penarikan dana' : 'Kelola saldo dan top up'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {isFreelancer && (
            <button 
              onClick={handleWithdraw}
              className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" /> Tarik Dana
            </button>
          )}
          <button 
            onClick={() => setShowTopUpModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Top Up Saldo
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        
        {/* Main Balance */}
        <div className="md:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 shadow-sm text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Wallet className="w-5 h-5 mr-2 opacity-80" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Saldo Aktif</span>
            </div>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="mb-4">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
              {showBalance ? formatCurrency(balance) : 'Rp •••••••••'}
            </h2>
          </div>
          <p className="text-sm text-white/80">
            {isFreelancer ? 'Pendapatan yang bisa ditarik' : 'Bisa digunakan untuk belanja jasa'}
          </p>
        </div>

        {/* Secondary Metrics */}
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dana Tertahan</p>
            <h3 className="text-2xl font-black text-gray-900">
              {showBalance ? formatCurrency(pendingEscrow) : 'Rp •••••••'}
            </h3>
            <div className="flex items-center text-[10px] text-orange-600 font-bold mt-2 bg-orange-50 w-max px-2 py-0.5 rounded">
              <Clock className="w-3 h-3 mr-1" /> Pekerjaan Berlangsung
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              {isFreelancer ? 'Total Pendapatan' : 'Total Belanja'}
            </p>
            <h3 className="text-2xl font-black text-gray-900">
              {showBalance ? formatCurrency(isFreelancer ? totalEarned : totalSpent) : 'Rp •••••••'}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wider">Akumulasi Seumur Hidup</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="font-bold text-gray-900 text-lg">Mutasi Transaksi</h3>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari ID ref..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-2 border-b border-gray-100 flex gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'credit', label: 'Pemasukan (+)' },
            { id: 'debit', label: 'Pengeluaran (-)' }
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
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((trx, idx) => {
              const isCredit = trx.TYPE === 'credit';
              let title = '';
              let label = '';
              
              if (trx.REFERENCE_TYPE === 'topup') {
                title = 'Top Up Saldo';
                label = 'Top Up';
              } else if (trx.REFERENCE_TYPE === 'order') {
                title = 'Pembelian Jasa';
                label = 'Purchase';
              } else if (trx.REFERENCE_TYPE === 'order_completed') {
                title = 'Pendapatan Jasa';
                label = 'Earning';
              } else if (trx.REFERENCE_TYPE === 'withdrawal') {
                title = 'Penarikan Dana';
                label = 'Withdraw';
              } else {
                title = trx.DESCRIPTION || 'Transaksi';
                label = trx.REFERENCE_TYPE;
              }
              
              return (
                <div key={idx} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100">
                      {isCredit ? (
                        label === 'Top Up' ? <Plus className="w-5 h-5 text-blue-500" /> : <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                      ) : (
                        label === 'Withdraw' ? <ArrowUpRight className="w-5 h-5 text-gray-700" /> : <CreditCard className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm md:text-base">{title}</h4>
                      <div className="flex items-center mt-1 text-[11px] text-gray-500 font-medium">
                        <span>{formatDate(trx.CREATED_AT)}</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="font-mono">{trx.REFERENCE_ID || trx.TRANSACTION_ID}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto pl-14 sm:pl-0 mt-3 sm:mt-0">
                    <p className={classNames(
                      "font-black text-base md:text-lg",
                      isCredit ? "text-emerald-600" : "text-gray-900"
                    )}>
                      {isCredit ? '+' : '-'}{showBalance ? formatCurrency(trx.AMOUNT) : 'Rp •••••••'}
                    </p>
                    <div className="flex sm:justify-end mt-1">
                      <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">
                        Success
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-gray-50/30">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="font-bold text-gray-900">Belum ada transaksi</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Top up atau belanja untuk mulai bertransaksi</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-black text-gray-900 mb-4">Top Up Saldo</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Top Up</label>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Minimal Rp 10.000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Metode Pembayaran</label>
              <div className="space-y-2">
                {[
                  { id: 'bank_transfer', name: 'Transfer Bank', icon: '🏦' },
                  { id: 'qris', name: 'QRIS', icon: '📱' },
                  { id: 'credit_card', name: 'Kartu Kredit', icon: '💳' }
                ].map(method => (
                  <label key={method.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-lg mr-2">{method.icon}</span>
                    <span className="font-medium text-gray-900">{method.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                fullWidth 
                onClick={handleTopUp} 
                disabled={isProcessing || !topUpAmount || parseInt(topUpAmount) < 10000}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Konfirmasi Top Up
              </Button>
              <Button variant="outline" fullWidth onClick={() => setShowTopUpModal(false)}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletView;