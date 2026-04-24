import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // 1. Import hooks routing
import { ChevronLeft, Clock, CheckCircle, MessageSquare, UploadCloud } from 'lucide-react';
import { DB_ORDERS, DB_ORDER_REVISIONS } from '../data/mockDatabase';
import { hydrateOrder, formatCurrency, formatDate, formatDateTime, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// 2. Hapus props navigate & viewParams
const OrderTrackView = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Ambil parameter "id" dari URL (misal: /order-track/9001)
  const [searchParams] = useSearchParams(); // Ambil query string (misal: ?mode=buying)

  // 3. Ekstrak dan konversi parameter
  const orderId     = Number(id) || 9001; 
  const contextMode = searchParams.get('mode') || 'selling';

  const rawOrder  = DB_ORDERS.find(o => o.order_id === orderId);
  const order     = rawOrder ? hydrateOrder(rawOrder) : null;
  const revisions = DB_ORDER_REVISIONS.filter(r => r.order_id === orderId);

  if (!order) return <div className="p-20 text-center font-bold text-xl text-gray-500">Order not found.</div>;

  const otherParty = contextMode === 'buying' ? order.freelancer : order.client;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">

      {/* 4. Ubah tujuan navigate menggunakan absolute path '/' */}
      <div className="flex items-center text-sm font-bold text-gray-500 mb-6 cursor-pointer hover:text-emerald-600 w-max" onClick={() => navigate('/orders')}>
        <ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Daftar Pesanan
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left: Timeline */}
        <div className="lg:w-2/3 space-y-6">
          <Card className="border-t-4 border-t-emerald-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-1">Pesanan ORD-{order.order_id}</h1>
                <p className="text-gray-500 font-medium">Batas Waktu Pengiriman: <span className="font-bold text-gray-900">{formatDateTime(order.deadline)}</span></p>
              </div>
              <Badge variant={order.status === 'completed' ? 'success' : order.status === 'revision' ? 'warning' : 'info'} className="text-sm px-3 py-1">
                {order.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 mt-10">

              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                <h3 className="font-bold text-gray-900">Pesanan Dibuat</h3>
                <p className="text-xs text-gray-400 font-bold mb-2">{formatDateTime(order.created_at)}</p>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-700 font-medium">
                  Pesanan untuk paket <span className="font-bold">[{order.package?.package_name?.toUpperCase()}]</span> berhasil dibayar dan dikonfirmasi.
                </div>
              </div>

              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                <h3 className="font-bold text-gray-900">Persyaratan (Requirements) Diterima</h3>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-700 font-medium mt-2">
                  <span className="font-bold text-gray-900 block mb-2">Instruksi Klien:</span>
                  "{order.requirements}"
                </div>
              </div>

              {revisions.map((rev) => (
                <div key={rev.revision_id} className="relative pl-8">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-orange-400 border-4 border-white shadow-sm"></div>
                  <h3 className="font-bold text-orange-600">Revisi Diminta</h3>
                  <p className="text-xs text-gray-400 font-bold mb-2">{formatDateTime(rev.requested_at)}</p>
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-sm text-orange-800 font-medium">
                    {rev.description}
                  </div>
                </div>
              ))}

              <div className="relative pl-8 pt-4">
                <div className="absolute -left-[11px] top-5 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm animate-pulse"></div>
                <div className="bg-white border-2 border-blue-200 shadow-md p-6 rounded-xl">
                  {order.status === 'completed' ? (
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <h3 className="font-black text-gray-900 text-lg mb-1">Pesanan Selesai</h3>
                      <p className="text-sm font-medium text-gray-500">Dana telah diteruskan ke Freelancer.</p>
                    </div>
                  ) : contextMode === 'selling' ? (
                    <div>
                      <h3 className="font-black text-gray-900 text-lg mb-2">Kirim Hasil Pekerjaan</h3>
                      <p className="text-sm font-medium text-gray-500 mb-4">Unggah file final atau tautan proyek untuk direview oleh klien.</p>
                      <Button fullWidth icon={UploadCloud}>Kirim (Deliver) Hasil Final</Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Clock className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                      <h3 className="font-black text-gray-900 text-lg mb-1">Menunggu Pekerjaan</h3>
                      <p className="text-sm font-medium text-gray-500">Freelancer sedang mengerjakan pesanan Anda.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:w-1/3 space-y-6">
          <Card className="bg-white">
            <h3 className="font-black text-gray-900 mb-4 pb-3 border-b border-gray-100">Detail Layanan</h3>
            <div className="flex gap-4 mb-4">
              <img src={order.service?.thumbnail_url} className="w-20 h-20 object-cover rounded-lg border border-gray-200" alt="" />
              <div>
                <p className="text-sm font-bold text-gray-900 line-clamp-3 leading-tight mb-2">{order.service?.title}</p>
                <Badge variant="purple">{order.package?.package_name}</Badge>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-3 mt-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold">Total Harga</span>
                <span className="font-black text-gray-900">{formatCurrency(order.total_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold">Waktu Pengiriman</span>
                <span className="font-black text-gray-900">{order.package?.delivery_days} Hari</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold">Jatah Revisi</span>
                <span className="font-black text-gray-900">{order.package?.revisions === 999 ? 'Unlimited' : order.package?.revisions}</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white">
            <h3 className="font-black text-gray-900 mb-4 pb-3 border-b border-gray-100">Kontak Partner</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar src={otherParty?.avatar_url} size="md" />
                <div className="ml-3">
                  <p className="font-bold text-gray-900">{otherParty?.full_name}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{contextMode === 'buying' ? 'Freelancer' : 'Klien'}</p>
                </div>
              </div>
              {/* 5. Ubah tujuan navigate */}
              <button className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors" onClick={() => navigate('/messages')}>
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default OrderTrackView;