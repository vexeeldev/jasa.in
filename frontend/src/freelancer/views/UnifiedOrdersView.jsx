import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Inbox, Loader2, CheckCircle, Eye, Upload } from 'lucide-react';
import { formatCurrency, formatDate } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

const API_BASE_URL = 'http://localhost:5000/api';

const UnifiedOrdersView = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Ambil role dari localStorage
  const userStr = localStorage.getItem('user');
  let userRole = '';
  try {
    const user = JSON.parse(userStr);
    userRole = user?.role || '';
  } catch (e) {
    userRole = '';
  }
  const isFreelancer = userRole === 'freelancer';
  const isClient = userRole === 'klien' || userRole === 'client';

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/orders`;
      
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        let filteredData = data.data;
        
        if (searchQuery) {
          filteredData = filteredData.filter(order => 
            order.ORDER_ID?.toString().includes(searchQuery) ||
            order.SERVICE_TITLE?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        setOrders(filteredData);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'in_progress' })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Order diterima! Silakan kerjakan pesanan ini.');
        fetchOrders();
      } else {
        alert(data.message || 'Gagal menerima order');
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Menunggu Diproses', color: 'bg-blue-100 text-blue-700' },
      'in_progress': { label: 'Sedang Dikerjakan', color: 'bg-indigo-100 text-indigo-700' },
      'waiting_approval': { label: 'Menunggu Review', color: 'bg-purple-100 text-purple-700' },
      'revision': { label: 'Revisi', color: 'bg-orange-100 text-orange-700' },
      'completed': { label: 'Selesai', color: 'bg-green-100 text-green-700' },
      'cancelled': { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
      'waiting_payment': { label: 'Menunggu Bayar', color: 'bg-yellow-100 text-yellow-700' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  };

  const tabs = [
    { id: 'all', label: 'Semua', icon: Inbox },
    { id: 'pending', label: 'Menunggu', icon: Clock },
    { id: 'in_progress', label: 'Dikerjakan', icon: CheckCircle },
    { id: 'waiting_approval', label: 'Review', icon: Eye },
    { id: 'completed', label: 'Selesai', icon: CheckCircle }
  ];

  const pageTitle = isFreelancer ? 'Pesanan Masuk' : 'Pesanan Saya';
  const pageDesc = isFreelancer 
    ? 'Kelola pesanan yang harus Anda kerjakan' 
    : 'Pantau status pesanan yang Anda beli';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">{pageTitle}</h1>
        <p className="text-gray-500 mt-1">{pageDesc}</p>
      </div>

      <Card className="overflow-hidden shadow-md">
        {/* Filter & Search Bar */}
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50/50 gap-4">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-white shadow-sm text-emerald-600 border border-gray-200' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari ID Pesanan..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                  {isFreelancer ? 'Klien' : 'Freelancer'}
                </th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Layanan</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tenggat</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length > 0 ? (
                orders.map((order) => {
                  const status = getStatusBadge(order.STATUS);
                  const otherPartyName = isFreelancer ? order.CLIENT_NAME : order.FREELANCER_NAME;
                  const otherPartyAvatar = isFreelancer ? order.CLIENT_AVATAR : order.FREELANCER_AVATAR;
                  
                  return (
                    <tr key={order.ORDER_ID} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={otherPartyAvatar} size="sm" />
                          <span className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {otherPartyName || '—'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1">{order.SERVICE_TITLE}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 font-mono">#{order.ORDER_ID}</span>
                          <Badge variant="default" className="text-[10px]">{order.PACKAGE_NAME}</Badge>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {order.STATUS !== 'completed' && order.DEADLINE ? (
                          <div className="flex items-center text-gray-700">
                            <Clock className="w-4 h-4 mr-1.5 text-emerald-500" />
                            <span className="text-sm font-medium">{formatDate(order.DEADLINE)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Selesai</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-900">{formatCurrency(order.TOTAL_PRICE)}</span>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <Badge className={status.color}>{status.label}</Badge>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        {isFreelancer && order.STATUS === 'pending' && (
                          <button
                            onClick={() => handleAcceptOrder(order.ORDER_ID)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                            Proses
                          </button>
                        )}
                        
                        {isFreelancer && order.STATUS === 'in_progress' && (
                          <button
                            onClick={() => navigate(`/freelancer/deliver/${order.ORDER_ID}`)}
                            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Upload className="w-3 h-3 inline mr-1" />
                            Kirim
                          </button>
                        )}
                        
                        {isClient && order.STATUS === 'waiting_approval' && (
                          <button
                            onClick={() => navigate(`/client/order-track/${order.ORDER_ID}`)}
                            className="px-4 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Eye className="w-3 h-3 inline mr-1" />
                            Review
                          </button>
                        )}
                        
                        {(isClient && order.STATUS !== 'waiting_approval') || 
                         (isFreelancer && order.STATUS !== 'pending' && order.STATUS !== 'in_progress') ? (
                          <button
                            onClick={() => {
                              if (isFreelancer) {
                                navigate(`/order-track/${order.ORDER_ID}`);
                              } else {
                                navigate(`/client/order-track/${order.ORDER_ID}`);
                              }
                            }}
                            className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Detail
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Belum ada pesanan</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {isFreelancer ? 'Belum ada pesanan yang masuk' : 'Belum ada pesanan yang dibuat'}
                    </p>
                    {isClient && (
                      <button 
                        onClick={() => navigate('/client/explore')}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                      >
                        Cari Jasa Sekarang
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UnifiedOrdersView;