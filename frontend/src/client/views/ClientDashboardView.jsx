import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, CheckCircle, DollarSign, Heart, 
  Clock, Package, ArrowRight, Loader2,
  Calendar, Activity, Search, Bookmark
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../data/helpers';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientDashboardView = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/dashboard/client`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDashboard(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const statusMap = {
      'pending': 'bg-amber-50 text-amber-600 border-amber-100',
      'in_progress': 'bg-blue-50 text-blue-600 border-blue-100',
      'waiting_approval': 'bg-purple-50 text-purple-600 border-purple-100',
      'completed': 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return statusMap[status] || 'bg-gray-50 text-gray-500 border-gray-100';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Memuat Panel Client</span>
      </div>
    );
  }

  const stats = dashboard?.order_stats || { ACTIVE_ORDERS: 0, COMPLETED_ORDERS: 0, TOTAL_SPENT: 0 };

  return (
    <div className="min-h-screen bg-[#FDFDFD] ">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Client</h1>
            <p className="text-gray-500 font-medium mt-1">Kelola project Anda dan pantau status pesanan.</p>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 px-6 py-6 rounded-xl flex gap-2"
            onClick={() => navigate('/client/explore')}
          >
            <Search className="w-5 h-5" /> Cari Jasa Baru
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Pesanan Aktif', value: stats.ACTIVE_ORDERS, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Selesai', value: stats.COMPLETED_ORDERS, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Belanja', value: formatCurrency(stats.TOTAL_SPENT), icon: ShoppingBag, color: 'text-gray-900', bg: 'bg-gray-100' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
              <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{item.value || 0}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content: Recent Orders */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Pesanan Terbaru
                </h3>
                <button 
                  onClick={() => navigate('/client/orders')}
                  className="text-xs font-bold text-emerald-600 hover:underline tracking-wider uppercase"
                >
                  Semua Pesanan
                </button>
              </div>
              
              <div className="divide-y divide-gray-50">
                {!dashboard?.recent_orders?.length ? (
                  <div className="py-20 text-center">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-4">Anda belum memiliki pesanan.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/client/explore')}>Mulai Cari Jasa</Button>
                  </div>
                ) : (
                  dashboard.recent_orders.map((order) => (
                    <div 
                      key={order.ORDER_ID}
                      onClick={() => navigate(`/client/order-track/${order.ORDER_ID}`)}
                      className="p-6 hover:bg-gray-50/80 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {order.SERVICE_TITLE}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-tighter border ${getStatusStyle(order.STATUS)}`}>
                            {order.STATUS.replace('_', ' ')}
                          </span>
                          <span className="text-gray-400 flex items-center gap-1 font-medium italic">
                             Order ID: #{order.ORDER_ID}
                          </span>
                          <span className="text-gray-400 flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(order.CREATED_AT)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900 text-lg">{formatCurrency(order.TOTAL_PRICE)}</p>
                        <div className="text-emerald-500 font-bold text-[10px] uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          Lacak Progres <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Wishlist Card */}
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-widest">Tersimpan</h4>
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{dashboard?.wishlist_count || 0}</p>
                  <p className="text-xs font-medium text-gray-400 mt-1">Jasa dalam wishlist</p>
                </div>
                <button 
                  onClick={() => navigate('/client/wishlist')}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Banner/Helper Card */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <Bookmark className="w-8 h-8 text-emerald-500 mb-4" />
                <h4 className="text-white font-bold text-lg leading-tight">Kelola Project Lebih Mudah</h4>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                  Gunakan fitur 'Messages' untuk diskusi mendalam dengan freelancer pilihan Anda.
                </p>
                <button 
                  onClick={() => navigate('/client/messages')}
                  className="mt-5 w-full py-2.5 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors"
                >
                  Buka Pesan
                </button>
              </div>
              {/* Decorative circle */}
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
            </div>

            {/* Quick Tips */}
            <div className="p-5 border border-dashed border-gray-200 rounded-2xl">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tips Aman</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Jangan pernah melakukan pembayaran di luar platform jasa.in untuk menjaga garansi uang kembali Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardView;