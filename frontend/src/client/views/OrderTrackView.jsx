import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, Clock, CheckCircle, MessageSquare, UploadCloud, 
  Download, XCircle, AlertCircle, Eye, ThumbsUp, RefreshCw,
  FileText, Calendar, Truck, Shield
} from 'lucide-react';
import { DB_ORDERS, DB_ORDER_REVISIONS, DB_ORDER_DELIVERIES } from '../data/mockDatabase';
import { hydrateOrder, formatCurrency, formatDate, formatDateTime, classNames } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RatingStars from '../components/ui/RatingStars';
import Textarea from '../components/ui/Textarea';

const ClientOrderTrackView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const orderId = Number(id) || 9001;
  
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const rawOrder = DB_ORDERS.find(o => o.order_id === orderId);
  const order = rawOrder ? hydrateOrder(rawOrder) : null;
  const revisions = DB_ORDER_REVISIONS.filter(r => r.order_id === orderId);
  const deliveries = DB_ORDER_DELIVERIES?.filter(d => d.order_id === orderId) || [];

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Tidak Ditemukan</h2>
          <p className="text-gray-500 mb-6">Pesanan dengan ID #{orderId} tidak ditemukan</p>
          <button onClick={() => navigate('/client/orders')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">
            Kembali ke Pesanan Saya
          </button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const config = {
      'pending': { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'in_progress': { label: 'Sedang Dikerjakan', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
      'waiting_approval': { label: 'Menunggu Persetujuan', color: 'bg-purple-100 text-purple-700', icon: Eye },
      'revision': { label: 'Revisi Diminta', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
      'completed': { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'cancelled': { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle }
    };
    return config[status] || config['pending'];
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const hasDelivery = deliveries.length > 0;
  const latestDelivery = deliveries[deliveries.length - 1];

  const handleApproveOrder = () => {
    // TODO: API call to approve order
    setShowCompleteModal(true);
  };

  const handleRequestRevision = () => {
    if (!revisionText.trim()) return;
    // TODO: API call to request revision
    setShowRevisionModal(false);
    setRevisionText('');
  };

  const handleDispute = () => {
    // TODO: Open dispute form
    alert('Fitur sengketa akan segera hadir');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/client/orders')} 
        className="flex items-center text-sm font-bold text-gray-500 mb-6 hover:text-emerald-600 transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> 
        Kembali ke Daftar Pesanan Saya
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Timeline & Progress */}
        <div className="lg:w-2/3 space-y-6">
          {/* Order Header */}
          <Card className="border-t-4 border-t-emerald-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-black text-gray-900">ORD-{order.order_id}</h1>
                  <Badge variant={statusConfig.color.split(' ')[0]} className="text-xs px-2 py-1">
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-gray-500 font-medium text-sm">
                  Dibeli pada: {formatDateTime(order.created_at)}
                </p>
              </div>
              
              {/* Countdown Timer jika belum selesai */}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-[10px] text-amber-600 font-bold uppercase">Estimasi Selesai</p>
                  <p className="text-sm font-black text-amber-700">{formatDate(order.deadline)}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 mt-6">
              
              {/* Step 1: Order Created */}
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                <h3 className="font-bold text-gray-900">Pesanan Dibuat & Dibayar</h3>
                <p className="text-xs text-gray-400 font-bold mb-2">{formatDateTime(order.created_at)}</p>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-sm text-gray-700">
                  Pembayaran sebesar <span className="font-bold text-emerald-600">{formatCurrency(order.total_price)}</span> telah diterima.
                  Dana ditahan oleh Jasa.in untuk keamanan transaksi.
                </div>
              </div>

              {/* Step 2: Requirements */}
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                <h3 className="font-bold text-gray-900">Detail Kebutuhan Proyek</h3>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-700 mt-2">
                  <p className="font-bold text-gray-900 mb-2">Instruksi Anda:</p>
                  <p className="italic">"{order.requirements || 'Belum ada instruksi'}"</p>
                </div>
              </div>

              {/* Step 3: Work Deliveries */}
              {deliveries.map((delivery, idx) => (
                <div key={delivery.delivery_id} className="relative pl-8">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                  <h3 className="font-bold text-blue-600">
                    {idx === deliveries.length - 1 ? 'Hasil Pekerjaan Dikirim' : `Pengiriman ke-${idx + 1}`}
                  </h3>
                  <p className="text-xs text-gray-400 font-bold mb-2">{formatDateTime(delivery.submitted_at)}</p>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <p className="text-sm font-medium text-gray-700 mb-3">{delivery.message}</p>
                    {delivery.attachments && delivery.attachments.length > 0 && (
                      <div className="flex gap-2">
                        {delivery.attachments.map((file, i) => (
                          <button key={i} className="flex items-center gap-1 text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300">
                            <Download className="w-3 h-3" />
                            {file.name}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons for Latest Delivery */}
                    {idx === deliveries.length - 1 && order.status === 'waiting_approval' && (
                      <div className="flex gap-3 mt-4 pt-3 border-t border-blue-200">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApproveOrder}>
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Terima & Selesai
                        </Button>
                        <Button size="sm" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50" onClick={() => setShowRevisionModal(true)}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Minta Revisi
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Step 4: Revisions */}
              {revisions.map((rev) => (
                <div key={rev.revision_id} className="relative pl-8">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-orange-400 border-4 border-white shadow-sm"></div>
                  <h3 className="font-bold text-orange-600">Revisi Diminta</h3>
                  <p className="text-xs text-gray-400 font-bold mb-2">{formatDateTime(rev.requested_at)}</p>
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-sm text-orange-800">
                    <p className="font-bold mb-1">Catatan Revisi:</p>
                    {rev.description}
                  </div>
                </div>
              ))}

              {/* Step 5: Completed */}
              {order.status === 'completed' && (
                <div className="relative pl-8">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                  <h3 className="font-bold text-green-600">Pesanan Selesai</h3>
                  <p className="text-xs text-gray-400 font-bold mb-2">{formatDateTime(order.completed_at || new Date())}</p>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-gray-900">Pesanan telah selesai!</p>
                    <p className="text-sm text-gray-600 mt-1">Dana telah dicairkan ke freelancer.</p>
                    <button className="mt-3 text-emerald-600 font-bold text-sm hover:underline">
                      Berikan Ulasan →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:w-1/3 space-y-6">
          {/* Service Info */}
          <Card>
            <h3 className="font-black text-gray-900 mb-4 pb-3 border-b border-gray-100">Detail Layanan</h3>
            <div className="flex gap-4 mb-4">
              <img 
                src={order.service?.thumbnail_url} 
                className="w-20 h-20 object-cover rounded-lg border border-gray-200" 
                alt=""
                onError={(e) => { e.target.src = 'https://via.placeholder.com/80'; }}
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-2">{order.service?.title}</p>
                <Badge variant="purple" size="sm">{order.package?.package_name}</Badge>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Harga Paket</span>
                <span className="font-bold text-gray-900">{formatCurrency(order.package?.price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Biaya Layanan</span>
                <span className="font-bold text-gray-900">{formatCurrency(order.service_fee || 0)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total Dibayar</span>
                <span className="font-black text-emerald-600 text-lg">{formatCurrency(order.total_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimasi Pengerjaan</span>
                <span className="font-bold text-gray-900 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {order.package?.delivery_days} hari kerja
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Jatah Revisi</span>
                <span className="font-bold text-gray-900">
                  {order.package?.revisions === 999 ? 'Unlimited' : `${order.package?.revisions}x`}
                  {revisions.length > 0 && ` (Terpakai: ${revisions.length})`}
                </span>
              </div>
            </div>
          </Card>

          {/* Freelancer Info */}
          <Card>
            <h3 className="font-black text-gray-900 mb-4 pb-3 border-b border-gray-100">Informasi Freelancer</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar src={order.freelancer?.avatar_url} size="md" />
                <div className="ml-3">
                  <p className="font-bold text-gray-900">{order.freelancer?.full_name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <RatingStars rating={order.freelancer?.rating || 4.5} size={12} />
                    <span className="text-xs text-gray-500">({order.freelancer?.total_reviews || 0})</span>
                  </div>
                </div>
              </div>
              <button 
                className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                onClick={() => navigate(`/client/messages?order=${order.order_id}`)}
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
            
            {/* Contact Info & Stats */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Tingkat Respon</span>
                <span className="font-bold text-gray-900">~ 1 jam</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Proyek Selesai</span>
                <span className="font-bold text-gray-900">{order.freelancer?.total_projects || 0} proyek</span>
              </div>
            </div>
          </Card>

          {/* Security Info */}
          <Card className="bg-emerald-50 border-emerald-100">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Transaksi 100% Aman</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Dana Anda aman ditahan oleh Jasa.in. Dana akan dicairkan ke freelancer 
                  hanya setelah Anda menyetujui hasil pekerjaan.
                </p>
              </div>
            </div>
          </Card>

          {/* Dispute Button */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <button 
              onClick={handleDispute}
              className="w-full py-2 text-red-600 text-sm font-bold hover:text-red-700 transition-colors flex items-center justify-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              Laporkan Masalah pada Pesanan Ini
            </button>
          )}
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-black text-gray-900 mb-2">Minta Revisi</h3>
            <p className="text-sm text-gray-500 mb-4">
              Jelaskan revisi yang Anda inginkan agar freelancer dapat memperbaikinya
            </p>
            <Textarea
              rows={4}
              placeholder="Contoh: Tolong ubah warna logo menjadi hijau, dan perbaiki font judul..."
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={handleRequestRevision}>
                Kirim Permintaan Revisi
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowRevisionModal(false)}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-900 mb-2">Konfirmasi Penyelesaian</h3>
            <p className="text-gray-500 mb-4">
              Apakah Anda puas dengan hasil pekerjaan freelancer? 
              Dana akan dicairkan ke freelancer setelah Anda konfirmasi.
            </p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                setShowCompleteModal(false);
                // TODO: Complete order API
              }}>
                Ya, Selesai
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowCompleteModal(false)}
              >
                Belum, Nanti Dulu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrderTrackView;