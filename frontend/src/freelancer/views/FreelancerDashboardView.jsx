import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, DollarSign, Star, Clock, Package, 
  Plus, ChevronRight, Wallet, Activity, Image, Settings
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../data/helpers';

const API_BASE_URL = 'http://localhost:5000/api';

const FreelancerDashboardView = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/dashboard/freelancer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setDashboard(data.data);
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-emerald-100 rounded-full mb-2 flex items-center justify-center">
            <div className="h-4 w-4 bg-emerald-500 rounded-full animate-ping"></div>
          </div>
          <span className="text-xs font-bold text-emerald-600 tracking-widest uppercase">Syncing</span>
        </div>
      </div>
    );
  }

  const stats = dashboard?.order_stats || { ACTIVE_ORDERS: 0, COMPLETED_ORDERS: 0, TOTAL_EARNED: 0 };
  const rating = dashboard?.rating || { RATING_AVG: 0, TOTAL_ORDERS: 0 };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-12">
      {/* Top Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 font-medium mt-1">Kelola proyek Anda dan lihat perkembangan pendapatan.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 flex gap-2 px-5 py-6 rounded-xl"
              onClick={() => navigate('/freelancer/services/create')}
            >
              <Plus className="w-5 h-5" /> Buat Jasa Baru
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* Highlight Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { label: 'Pesanan Aktif', value: stats.ACTIVE_ORDERS, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Proyek Selesai', value: stats.COMPLETED_ORDERS, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Saldo', value: formatCurrency(stats.TOTAL_EARNED), icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-50' },
            { label: 'Rating Client', value: rating.RATING_AVG, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mb-4`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{item.value || 0}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Orders Section (Main Content) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Aktivitas Pesanan Terbaru
                </h3>
                <button onClick={() => navigate('/orders')} className="text-xs font-bold text-emerald-600 hover:underline tracking-wider uppercase">Lihat Semua</button>
              </div>
              
              <div className="divide-y divide-gray-50">
                {!dashboard?.recent_orders?.length ? (
                  <div className="p-20 text-center">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Belum ada pesanan masuk saat ini.</p>
                  </div>
                ) : (
                  dashboard.recent_orders.map((order) => (
                    <div 
                      key={order.ORDER_ID}
                      onClick={() => navigate(`/freelancer/orders/${order.ORDER_ID}`)}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-900">{order.SERVICE_TITLE}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                            {order.STATUS.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{order.CLIENT_NAME}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(order.TOTAL_PRICE)}</p>
                        <p className="text-[10px] text-gray-300 font-medium mt-1">{formatDate(order.CREATED_AT)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area (Quick Actions & Helper) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-widest mb-6">Tindakan Cepat</h4>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => navigate('/freelancer/portfolios/create')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-50 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-100 group transition-all"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:text-emerald-600 transition-colors">
                    <Image className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">Update Portofolio</p>
                    <p className="text-[11px] text-gray-400 font-medium italic">Tampilkan karya terbaru</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/freelancer/settings')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-50 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 group transition-all"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:text-blue-600 transition-colors">
                    <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">Pengaturan Akun</p>
                    <p className="text-[11px] text-gray-400 font-medium italic">Edit profil & jasa Anda</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-emerald-900 p-8 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="relative z-10 text-white">
                <h4 className="font-bold text-lg leading-snug">Butuh Tips Mendapatkan Lebih Banyak Order?</h4>
                <p className="text-emerald-100/70 text-xs mt-3 leading-relaxed">Pastikan Anda merespon pesan klien kurang dari 1 jam untuk mempertahankan badge "Fast Response".</p>
                <div className="mt-6 flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                  Pelajari Lebih Lanjut <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              {/* Decorative Glow */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-[60px] group-hover:bg-emerald-500/30 transition-all duration-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboardView;