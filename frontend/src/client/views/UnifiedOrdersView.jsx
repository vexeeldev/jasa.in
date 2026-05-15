import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Eye,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle
} from 'lucide-react';

import { formatCurrency, formatDate } from '../data/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientOrdersView = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    setShowContent(false);

    try {
      const token = localStorage.getItem('token');

      const url =
        activeTab === 'all'
          ? `${API_BASE_URL}/orders`
          : `${API_BASE_URL}/orders?status=${activeTab}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Failed fetch orders:', error);
    } finally {
      setTimeout(() => {
        setLoading(false);

        setTimeout(() => {
          setShowContent(true);
        }, 50);
      }, 250);
    }
  };

  // 🔥 Fungsi untuk membatalkan order
  const handleCancelOrder = async (orderId, e) => {
    e.stopPropagation(); // Mencegah navigasi ke detail order
    
    if (!confirm('Yakin ingin membatalkan pesanan ini? Dana akan dikembalikan ke saldo Anda.')) {
      return;
    }
    
    setCancellingOrderId(orderId);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: 'Dibatalkan oleh client'
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('Pesanan berhasil dibatalkan. Dana telah dikembalikan ke saldo Anda.');
        fetchOrders(); // Refresh daftar order
      } else {
        alert(data.message || 'Gagal membatalkan pesanan');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Terjadi kesalahan saat membatalkan pesanan');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      waiting_payment: {
        label: 'Menunggu Bayar',
        color: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        icon: Clock3,
        canCancel: true
      },
      pending: {
        label: 'Pending',
        color: 'bg-sky-50 text-sky-700 border border-sky-200',
        icon: Loader2,
        canCancel: true
      },
      in_progress: {
        label: 'Dikerjakan',
        color: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
        icon: Loader2,
        canCancel: false
      },
      waiting_approval: {
        label: 'Review',
        color: 'bg-purple-50 text-purple-700 border border-purple-200',
        icon: Eye,
        canCancel: false
      },
      revision: {
        label: 'Revisi',
        color: 'bg-orange-50 text-orange-700 border border-orange-200',
        icon: AlertCircle,
        canCancel: false
      },
      completed: {
        label: 'Selesai',
        color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        icon: CheckCircle2,
        canCancel: false
      },
      cancelled: {
        label: 'Dibatalkan',
        color: 'bg-red-50 text-red-700 border border-red-200',
        icon: AlertCircle,
        canCancel: false
      }
    };

    return (
      statusMap[status] || {
        label: status || 'Unknown',
        color: 'bg-gray-50 text-gray-700 border border-gray-200',
        icon: AlertCircle,
        canCancel: false
      }
    );
  };

  const tabs = [
    { id: 'all', label: 'Semua' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'Progress' },
    { id: 'waiting_approval', label: 'Review' },
    { id: 'completed', label: 'Selesai' }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="w-44 h-8 rounded-xl bg-gray-200 animate-[pulse_1.8s_ease-in-out_infinite] mb-3"></div>
          <div className="w-72 h-4 rounded-lg bg-gray-100 animate-[pulse_1.8s_ease-in-out_infinite]"></div>
        </div>
        <div className="flex gap-3 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-24 h-10 rounded-2xl bg-gray-100 animate-[pulse_1.8s_ease-in-out_infinite]" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-gray-100 bg-white p-5">
              <div className="animate-[pulse_1.8s_ease-in-out_infinite]">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="w-24 h-4 rounded bg-gray-200 mb-3"></div>
                    <div className="w-56 h-5 rounded bg-gray-200 mb-2"></div>
                    <div className="w-40 h-4 rounded bg-gray-100"></div>
                  </div>
                  <div>
                    <div className="w-28 h-5 rounded bg-gray-200 mb-2"></div>
                    <div className="w-20 h-4 rounded bg-gray-100"></div>
                  </div>
                </div>
                <div className="w-full h-px bg-gray-100"></div>
                <div className="flex justify-end mt-4">
                  <div className="w-20 h-4 rounded bg-gray-100"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Pesanan Saya</h1>
          <p className="text-gray-500 mt-1">Pantau progress pesanan dan projectmu</p>
        </div>
        <div className="px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium mb-1">Total Pesanan</p>
          <h2 className="text-2xl font-semibold text-emerald-700">{orders.length}</h2>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* EMPTY */}
      {orders.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-gray-200 py-20 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-5" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada Pesanan</h3>
          <p className="text-gray-500 mb-6">Yuk mulai cari jasa dan buat project pertamamu</p>
          <button
            onClick={() => navigate('/client/explore')}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition"
          >
            Cari Jasa
          </button>
        </Card>
      ) : (
        <div
          className={`space-y-4 transition-all duration-500 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {orders.map((order) => {
            const rawStatus = order.STATUS || order.status || '';
            const normalizedStatus = rawStatus.toLowerCase();
            const status = getStatusBadge(normalizedStatus);
            const StatusIcon = status.icon;
            const canCancel = status.canCancel && normalizedStatus !== 'cancelled';

            return (
              <Card
                key={order.ORDER_ID}
                className="group rounded-3xl border border-gray-100 bg-white p-5 hover:shadow-md transition-all duration-300"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/client/order-track/${order.ORDER_ID}`)}
                >
                  <div className="flex flex-wrap justify-between items-start gap-5">
                    {/* LEFT */}
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <span className="text-xs tracking-wide text-gray-400 font-medium">
                          ORDER-{order.ORDER_ID}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-1 leading-snug">
                        {order.SERVICE_TITLE}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Paket:
                        <span className="text-gray-700 ml-1 font-medium">
                          {order.PACKAGE_NAME}
                        </span>
                      </p>
                    </div>

                    {/* RIGHT */}
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-emerald-600">
                        {formatCurrency(order.TOTAL_PRICE)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(order.CREATED_AT)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* FOOTER - dengan tombol batal */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock3 className="w-3.5 h-3.5" />
                    Update terbaru
                  </div>
                  <div className="flex gap-2">
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order.ORDER_ID, e);
                        }}
                        disabled={cancellingOrderId === order.ORDER_ID}
                      >
                        {cancellingOrderId === order.ORDER_ID ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        Batal
                      </Button>
                    )}
                    <button
                      onClick={() => navigate(`/client/order-track/${order.ORDER_ID}`)}
                      className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      Detail
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientOrdersView;