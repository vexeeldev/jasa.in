import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Inbox, Package, CheckCircle, AlertCircle, RefreshCw, Eye, ChevronRight, Calendar, Filter } from 'lucide-react';
import { DB_USERS, DB_ORDERS } from '../data/mockDatabase';
import { hydrateOrder, getProfileByUserId, formatCurrency, formatDate, formatDateTime, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ClientOrdersView = () => {
  const navigate = useNavigate();
  
  // Current user sebagai client
  const currentUser = DB_USERS.find(u => u.role === 'client') || DB_USERS[0];
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const hydratedOrders = DB_ORDERS.map(hydrateOrder);

  // Hanya pesanan dimana currentUser adalah client (pembeli)
  const myOrders = hydratedOrders.filter(o => o.client_id === currentUser.user_id);

  // Filter berdasarkan status
  const filteredByStatus = myOrders.filter(order => filter === 'all' || order.status === filter);

  // Filter berdasarkan search
  const filteredOrders = filteredByStatus.filter(order => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      order.order_id.toString().includes(searchLower) ||
      order.service?.title?.toLowerCase().includes(searchLower) ||
      order.freelancer?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  // Sort orders by newest first
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  const tabs = [
    { id: 'all', label: 'Semua Pesanan', icon: Package },
    { id: 'pending', label: 'Menunggu', icon: Clock, count: myOrders.filter(o => o.status === 'pending').length },
    { id: 'in_progress', label: 'Dikerjakan', icon: RefreshCw, count: myOrders.filter(o => o.status === 'in_progress').length },
    { id: 'waiting_approval', label: 'Review', icon: Eye, count: myOrders.filter(o => o.status === 'waiting_approval').length },
    { id: 'revision', label: 'Revisi', icon: AlertCircle, count: myOrders.filter(o => o.status === 'revision').length },
    { id: 'completed', label: 'Selesai', icon: CheckCircle, count: myOrders.filter(o => o.status === 'completed').length }
  ];

  const getStatusConfig = (status) => {
    const config = {
      'pending': { label: 'Menunggu Konfirmasi', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'in_progress': { label: 'Sedang Dikerjakan', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
      'waiting_approval': { label: 'Menunggu Persetujuan', color: 'bg-purple-100 text-purple-700', icon: Eye },
      'revision': { label: 'Revisi Diminta', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
      'completed': { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'cancelled': { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    };
    return config[status] || config['pending'];
  };

  const getProgressPercentage = (order) => {
    const steps = {
      'pending': 10,
      'in_progress': 40,
      'waiting_approval': 70,
      'revision': 50,
      'completed': 100
    };
    return steps[order.status] || 0;
  };

  if (myOrders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Belum Ada Pesanan</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Anda belum memiliki pesanan. Mulai pesan jasa freelance sekarang!
          </p>
          <Button size="lg" onClick={() => navigate('/client/explore')}>
            Cari Jasa Sekarang
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Pesanan Saya</h1>
        <p className="text-gray-500 font-medium mt-1">Pantau status dan kelola semua pesanan Anda</p>
      </div>

      <Card noPadding className="overflow-hidden shadow-xl border-0">
        {/* Tabs & Search Bar */}
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6 bg-white">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={classNames(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap",
                      filter === tab.id 
                        ? "bg-emerald-600 text-white shadow-md" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count > 0 && filter !== tab.id && (
                      <span className="ml-1 text-xs bg-gray-300 px-1.5 py-0.5 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari pesanan (ID, layanan, freelancer)..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden px-4 py-2 bg-gray-50 border-b border-gray-200">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600"
          >
            <Filter className="w-4 h-4" />
            Filter & Urutkan
          </button>
        </div>

        {/* Orders List */}
        <div className="divide-y divide-gray-100 bg-white">
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const progress = getProgressPercentage(order);
              
              return (
                <div 
                  key={order.order_id}
                  className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition-all group"
                  onClick={() => navigate(`/client/order-track/${order.order_id}`)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    
                    {/* Left: Order Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          ORD-{order.order_id}
                        </span>
                        <Badge variant={statusConfig.color.split(' ')[0]} className="text-[10px]">
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {order.status === 'waiting_approval' && (
                          <Badge variant="purple" className="text-[10px] animate-pulse">
                            Perlu Tindakan Anda
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-emerald-600 transition-colors">
                        {order.service?.title || 'Layanan Jasa'}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <Avatar src={order.freelancer?.avatar_url} size="xs" />
                          <span className="font-medium">{order.freelancer?.full_name}</span>
                          <span className="text-gray-400">(Freelancer)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>Paket {order.package?.package_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Center: Progress & Date */}
                    <div className="lg:w-64">
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-bold text-gray-700">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {formatDate(order.deadline)}</span>
                      </div>
                    </div>

                    {/* Right: Price & Action */}
                    <div className="flex items-center justify-between lg:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
                        <p className="text-xl font-black text-gray-900">{formatCurrency(order.total_price)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>

                  {/* Action Buttons for orders needing attention */}
                  {order.status === 'waiting_approval' && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex gap-3">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/client/order-track/${order.order_id}`);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Lihat & Setujui
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/client/order-track/${order.order_id}?action=revision`);
                        }}
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Minta Revisi
                      </Button>
                    </div>
                  )}

                  {/* Rating CTA for completed orders */}
                  {order.status === 'completed' && !order.rated && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button 
                        className="text-sm text-emerald-600 font-bold hover:underline flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to rating modal
                        }}
                      >
                        <Star className="w-4 h-4" />
                        Berikan Ulasan untuk Freelancer
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-6 py-20 text-center">
              <Inbox className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-xl font-black text-gray-900 mb-2">Tidak ada pesanan</p>
              <p className="text-gray-500 font-medium">
                {searchQuery 
                  ? `Tidak ditemukan pesanan dengan kata "${searchQuery}"`
                  : `Tidak ada pesanan dengan status ${filter === 'all' ? 'apapun' : filter.replace('_', ' ')}`}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Order Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Pesanan</p>
          <p className="text-2xl font-black text-gray-900">{myOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Sedang Berjalan</p>
          <p className="text-2xl font-black text-blue-600">
            {myOrders.filter(o => ['pending', 'in_progress', 'waiting_approval', 'revision'].includes(o.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Selesai</p>
          <p className="text-2xl font-black text-green-600">
            {myOrders.filter(o => o.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Belanja</p>
          <p className="text-2xl font-black text-emerald-600">
            {formatCurrency(myOrders.reduce((sum, o) => sum + o.total_price, 0))}
          </p>
        </div>
      </div>
    </div>
  );
};

// Star component for rating
const Star = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

export default ClientOrdersView;