import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, Clock, CheckCircle, MessageSquare, 
  Download, XCircle, AlertCircle, Eye, ThumbsUp, RefreshCw,
  FileText, Calendar, Shield, Loader2, Star
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../data/helpers';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Textarea from '../components/ui/Textarea';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const ClientOrderTrackView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const orderId = Number(id);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  
  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  useEffect(() => {
    if (order?.STATUS === 'completed') {
      checkCanReview();
      fetchExistingReview();
    }
  }, [order?.STATUS]);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const orderRes = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orderData = await orderRes.json();
      
      if (orderData.success) {
        setOrder(orderData.data);
        setRevisions(orderData.data.REVISIONS || []);
        setDeliveries(orderData.data.DELIVERIES || []);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if can review
  const checkCanReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reviews/check/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const canReview = data.data.can_review;
        setHasReviewed(!canReview);
        setShowReviewForm(canReview);
      }
    } catch (error) {
      console.error('Error checking review:', error);
    }
  };


  // Fetch existing review
  const fetchExistingReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reviews/order/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Existing review data:', data); // 🔥 Debug
      
      if (data.success && data.data) {
        setExistingReview(data.data);
        setHasReviewed(true);
        setReviewRating(data.data.RATING);
        setReviewComment(data.data.REVIEW_COMMENT || '');
        setShowReviewForm(false);
      } else {
        setHasReviewed(false);
        setShowReviewForm(true);
        setExistingReview(null);
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    }
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (reviewRating < 1 || reviewRating > 5) {
      alert('Rating harus antara 1-5');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reviews/order/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          review_comment: reviewComment
        })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Terima kasih! Review Anda telah disimpan.');
        setHasReviewed(true);
        setShowReviewForm(false);
        await fetchExistingReview();
      } else {
        alert(data.message || 'Gagal menyimpan review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSubmittingReview(false);
    }
  };


  // Update review
  const handleUpdateReview = async () => {
    if (!existingReview) return;
    
    if (reviewRating < 1 || reviewRating > 5) {
      alert('Rating harus antara 1-5');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reviews/${existingReview.REVIEW_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          review_comment: reviewComment
        })
      });
      const data = await res.json();
      
      console.log('Update review response:', data); // 🔥 Debug
      
      if (data.success) {
        alert('Review berhasil diupdate!');
        // Refresh review data
        await fetchExistingReview();
        setShowReviewForm(false);
      } else {
        alert(data.message || 'Gagal mengupdate review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!confirm('Yakin ingin menghapus review ini?')) return;
    
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reviews/${existingReview.REVIEW_ID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Review berhasil dihapus');
        setHasReviewed(false);
        setShowReviewForm(true);
        setExistingReview(null);
        setReviewRating(5);
        setReviewComment('');
      } else {
        alert(data.message || 'Gagal menghapus review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownload = (file) => {
    if (file.url && file.url !== '#') {
      window.open(file.url, '_blank');
    } else {
      alert('File tidak tersedia');
    }
  };

  const getSortedEvents = () => {
    const events = [];
    
    deliveries.forEach((d, idx) => {
      events.push({
        type: 'delivery',
        data: d,
        timestamp: new Date(d.SUBMITTED_AT),
        id: d.DELIVERY_ID || idx,
        index: idx
      });
    });
    
    revisions.forEach((r, idx) => {
      events.push({
        type: 'revision',
        data: r,
        timestamp: new Date(r.REQUESTED_AT),
        id: r.REVISION_ID || idx
      });
    });
    
    events.sort((a, b) => a.timestamp - b.timestamp);
    return events;
  };

  const handleApproveOrder = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setShowCompleteModal(false);
        fetchOrderData();
        alert('Pesanan telah diselesaikan!');
      } else {
        alert(data.message || 'Gagal menyetujui pesanan');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionText.trim()) {
      alert('Mohon isi deskripsi revisi');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description: revisionText })
      });
      const data = await res.json();
      
      if (data.success) {
        setShowRevisionModal(false);
        setRevisionText('');
        fetchOrderData();
        alert('Permintaan revisi berhasil dikirim');
      } else {
        alert(data.message || 'Gagal mengirim revisi');
      }
    } catch (error) {
      console.error('Revision error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      'waiting_payment': { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'pending': { label: 'Menunggu Diproses', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
      'in_progress': { label: 'Sedang Dikerjakan', color: 'bg-indigo-100 text-indigo-700', icon: RefreshCw },
      'waiting_approval': { label: 'Menunggu Persetujuan', color: 'bg-purple-100 text-purple-700', icon: Eye },
      'revision': { label: 'Revisi Diminta', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
      'completed': { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'cancelled': { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle }
    };
    return config[status] || config['pending'];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Pesanan dengan ID #{orderId} tidak ditemukan</p>
        <button onClick={() => navigate('/client/orders')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg">
          Kembali ke Pesanan Saya
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.STATUS);
  const StatusIcon = statusConfig.icon;
  const timelineEvents = getSortedEvents();
  const totalDeliveries = deliveries.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      
      <button 
        onClick={() => navigate('/client/orders')} 
        className="flex items-center text-sm text-gray-500 mb-6 hover:text-emerald-600 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> 
        Kembali ke Daftar Pesanan Saya
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Timeline */}
        <div className="lg:w-2/3 space-y-6">
          <Card className="border-t-4 border-t-emerald-500 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">ORDER-{order.ORDER_ID}</h1>
                    <Badge className={`${statusConfig.color} px-2 py-1 text-xs`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <p className="text-gray-500 text-sm">Dibeli: {formatDateTime(order.CREATED_AT)}</p>
                </div>
                
                {order.STATUS !== 'completed' && order.STATUS !== 'cancelled' && order.DEADLINE && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1 text-center">
                    <p className="text-[10px] text-amber-600 font-bold">Estimasi Selesai</p>
                    <p className="text-sm font-bold text-amber-700">{formatDate(order.DEADLINE)}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 mt-6">
                {/* Order Created */}
                <div className="relative pl-8">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                  <h3 className="font-bold text-gray-900">Pesanan Dibuat</h3>
                  <p className="text-xs text-gray-400 mb-2">{formatDateTime(order.CREATED_AT)}</p>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-sm">
                    Pembayaran <span className="font-bold">{formatCurrency(order.TOTAL_PRICE)}</span> telah diterima.
                  </div>
                </div>

                {/* Requirements */}
                <div className="relative pl-8">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                  <h3 className="font-bold text-gray-900">Detail Kebutuhan Proyek</h3>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm mt-2">
                    <p className="font-bold mb-2">Instruksi Anda:</p>
                    <p className="italic">"{order.REQUIREMENTS || 'Belum ada instruksi'}"</p>
                  </div>
                </div>

                {/* Events */}
                {timelineEvents.map((event, idx) => {
                  if (event.type === 'revision') {
                    const rev = event.data;
                    return (
                      <div key={`rev-${rev.REVISION_ID || idx}`} className="relative pl-8">
                        <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-orange-400 border-4 border-white shadow-sm"></div>
                        <h3 className="font-bold text-orange-600">Revisi Diminta</h3>
                        <p className="text-xs text-gray-400 mb-2">{formatDateTime(rev.REQUESTED_AT)}</p>
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg text-sm">
                          <p className="font-bold mb-1">Catatan Revisi:</p>
                          {rev.DESCRIPTION}
                        </div>
                      </div>
                    );
                  }
                  
                  if (event.type === 'delivery') {
                    const delivery = event.data;
                    const isLastDelivery = event.index === totalDeliveries - 1;
                    const deliveryNumber = event.index + 1;
                    
                    return (
                      <div key={`del-${delivery.DELIVERY_ID || idx}`} className="relative pl-8">
                        <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                        <h3 className="font-bold text-blue-600">
                          {isLastDelivery ? 'Hasil Pekerjaan Dikirim' : `Pengiriman ke-${deliveryNumber}`}
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">{formatDateTime(delivery.SUBMITTED_AT)}</p>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 mb-4">{delivery.MESSAGE}</p>
                          
                          {delivery.ATTACHMENTS && delivery.ATTACHMENTS.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-xs font-semibold text-gray-500 mb-2">📎 Lampiran File:</p>
                              <div className="flex flex-wrap gap-3">
                                {delivery.ATTACHMENTS.map((file, fileIdx) => (
                                  <div key={fileIdx} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm hover:shadow-md transition-all">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-700 max-w-[200px] truncate">
                                      {file.name}
                                    </span>
                                    <button
                                      onClick={() => handleDownload(file)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {isLastDelivery && order.STATUS === 'waiting_approval' && (
                            <div className="flex gap-3 mt-5 pt-4 border-t border-blue-200">
                              <Button size="md" className="bg-green-600 hover:bg-green-700" onClick={() => setShowCompleteModal(true)} disabled={actionLoading}>
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Terima & Selesai
                              </Button>
                              <Button size="md" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50" onClick={() => setShowRevisionModal(true)} disabled={actionLoading}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Minta Revisi
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Completed */}
                {order.STATUS === 'completed' && (
                  <div className="relative pl-8">
                    <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                    <h3 className="font-bold text-green-600">Pesanan Selesai</h3>
                    <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="font-medium text-green-700">Pesanan telah selesai!</p>
                      </div>
                      <p className="text-sm text-green-600">Dana telah dicairkan ke freelancer.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* REVIEW SECTION */}
          {order?.STATUS === 'completed' && (
            <Card className="overflow-hidden border-t-4 border-t-yellow-400">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <h3 className="text-xl font-bold text-gray-900">Berikan Review</h3>
                </div>
                
                {showReviewForm && (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Rating Anda *</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star 
                              className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Komentar (Opsional)</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        placeholder="Ceritakan pengalaman Anda bekerja dengan freelancer ini..."
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSubmitReview} 
                      disabled={submittingReview}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Kirim Review
                    </Button>
                  </div>
                )}
                
                {existingReview && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">Review Anda</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`w-4 h-4 ${star <= existingReview.RATING ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{existingReview.RATING}.0</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(existingReview.CREATED_AT)}
                      </span>
                    </div>
                    <p className="text-gray-700">{existingReview.REVIEW_COMMENT || 'Tidak ada komentar'}</p>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => {
                          setReviewRating(existingReview.RATING);
                          setReviewComment(existingReview.REVIEW_COMMENT || '');
                          setShowReviewForm(true);
                          setExistingReview(null);
                        }}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Edit Review
                      </button>
                      <button 
                        onClick={handleDeleteReview}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Hapus Review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="lg:w-1/3 space-y-6">
          <Card>
            <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b">Detail Layanan</h3>
            <div className="flex gap-4 mb-4">
              <img 
                src={getFullImageUrl(order.THUMBNAIL_URL) || 'https://placehold.co/80'} 
                className="w-20 h-20 object-cover rounded-lg border" 
                alt=""
              />
              <div>
                <p className="text-sm font-bold">{order.SERVICE_TITLE}</p>
                <Badge variant="purple" size="sm">{order.PACKAGE_NAME}</Badge>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Dibayar</span>
                <span className="font-bold text-emerald-600">{formatCurrency(order.TOTAL_PRICE)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimasi</span>
                <span className="font-bold">{order.DELIVERY_DAYS || 3} hari</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b">Informasi Freelancer</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={order.FREELANCER_AVATAR} size="md" />
                <div>
                  <p className="font-bold">{order.FREELANCER_NAME}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-sm">{order.FREELANCER_RATING || 0}</span>
                  </div>
                </div>
              </div>
              <button className="p-2 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              </button>
            </div>
          </Card>

          <Card className="bg-emerald-50 border-emerald-100">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Transaksi 100% Aman</h4>
                <p className="text-xs text-gray-600">Dana ditahan hingga Anda menyetujui hasil pekerjaan.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-2">Minta Revisi</h3>
            <p className="text-sm text-gray-500 mb-4">Jelaskan revisi yang Anda inginkan</p>
            <Textarea
              rows={4}
              placeholder="Contoh: Tolong ubah warna logo menjadi hijau..."
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={handleRequestRevision} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Revisi'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowRevisionModal(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Konfirmasi Penyelesaian</h3>
            <p className="text-gray-500 mb-4">Apakah Anda puas dengan hasil pekerjaan freelancer?</p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApproveOrder} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Selesai'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowCompleteModal(false)}>Belum</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrderTrackView;