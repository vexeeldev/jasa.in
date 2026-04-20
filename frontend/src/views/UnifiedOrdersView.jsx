import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import hook navigasi
import { Search, Clock, Inbox } from 'lucide-react';
import { DB_USERS, DB_ORDERS } from '../data/mockDatabase';
import { hydrateOrder, getProfileByUserId, formatCurrency, formatDate, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

// 2. Hapus prop 'navigate'
const UnifiedOrdersView = () => {
  const navigate = useNavigate(); // 3. Inisialisasi hook

  const currentUser   = DB_USERS[0];
  const [contextMode, setContextMode] = useState('selling');
  const [filter, setFilter]           = useState('all');

  const hydratedOrders = DB_ORDERS.map(hydrateOrder);

  const contextOrders = hydratedOrders.filter(o => {
    if (contextMode === 'buying') return o.client_id === currentUser.user_id;
    return o.freelancer_id === getProfileByUserId(currentUser.user_id)?.profile_id;
  });

  const filteredOrders = contextOrders.filter(order => filter === 'all' || order.status === filter);

  const tabs = [
    { id: 'all',         label: 'Semua Pesanan' },
    { id: 'in_progress', label: 'Sedang Berjalan' },
    { id: 'revision',    label: 'Revisi' },
    { id: 'completed',   label: 'Selesai' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Manajemen Pesanan</h1>
          <p className="text-gray-500 font-medium mt-2">Satu tempat untuk memantau semua proyek Anda.</p>
        </div>

        {/* Context Toggle */}
        <div className="flex p-1.5 bg-gray-200 rounded-xl w-full lg:w-auto">
          <button
            onClick={() => setContextMode('buying')}
            className={classNames("flex-1 lg:w-48 py-2.5 px-4 rounded-lg text-sm font-black transition-all", contextMode === 'buying' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            Sebagai Klien (Membeli)
          </button>
          <button
            onClick={() => setContextMode('selling')}
            className={classNames("flex-1 lg:w-48 py-2.5 px-4 rounded-lg text-sm font-black transition-all", contextMode === 'selling' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            Sebagai Freelancer (Menjual)
          </button>
        </div>
      </div>

      <Card noPadding className="border-t-4 border-t-gray-900 shadow-md">
        <div className="border-b border-gray-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50/50 gap-4">
          <nav className="flex space-x-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={classNames(
                  tab.id === filter ? 'bg-white shadow-sm text-gray-900 border-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent',
                  'px-4 py-2 border font-bold text-sm rounded-lg transition-all whitespace-nowrap'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari ID Pesanan..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">{contextMode === 'buying' ? 'Freelancer' : 'Klien'}</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Layanan (Service)</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Tenggat Waktu</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Total Harga</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const statusInfo = {
                    'pending':     { color: 'default', label: 'Menunggu Persetujuan' },
                    'in_progress': { color: 'info',    label: 'Proses Pengerjaan' },
                    'revision':    { color: 'warning', label: 'Revisi Diminta' },
                    'completed':   { color: 'success', label: 'Selesai' },
                    'cancelled':   { color: 'danger',  label: 'Dibatalkan' },
                  };

                  const otherParty = contextMode === 'buying' ? order.freelancer : order.client;

                  return (
                    <tr 
                      key={order.order_id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors group" 
                      // 4. Ubah format onClick navigate ke URL (menyertakan ID pesanan dan query parameter mode)
                      onClick={() => navigate(`/order-track/${order.order_id}?mode=${contextMode}`)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <Avatar src={otherParty?.avatar_url} size="sm" />
                          <span className="font-bold text-gray-900 group-hover:text-emerald-600 ml-3 transition-colors">{otherParty?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-gray-900 max-w-[250px] truncate">{order.service?.title || 'Unknown Service'}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1.5">
                          <span className="font-mono text-gray-400 mr-2">ORD-{order.order_id}</span>
                          <Badge variant="default" className="text-[9px]">{order.package?.package_name}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {order.status !== 'completed' ? (
                          <div className="flex items-center font-bold text-gray-700">
                            <Clock className="w-4 h-4 mr-2 text-emerald-500" />
                            {formatDate(order.deadline)}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-bold">Selesai: {formatDate(order.completed_at)}</span>
                        )}
                      </td>
                      <td className="px-6 py-5 font-black text-gray-900 text-base">
                        {formatCurrency(order.total_price)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Badge variant={statusInfo[order.status]?.color}>{statusInfo[order.status]?.label}</Badge>
                        <div className="text-[10px] text-emerald-600 font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Lihat Detail →</div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-gray-500">
                    <Inbox className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-xl font-black text-gray-900 mb-2">Tidak ada pesanan</p>
                    <p className="text-sm font-medium">Data tabel ORDERS kosong untuk filter ini.</p>
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