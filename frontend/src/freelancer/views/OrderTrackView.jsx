import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileText, X, Loader2, CheckCircle, Clock, RefreshCw, Star, MessageCircle, User, Calendar,  XCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { formatCurrency, formatDateTime, formatDate } from '../data/helpers';

const API_BASE_URL = 'http://localhost:5000/api';
const STATIC_URL = 'http://localhost:5000';

const FreelancerOrderTrackView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  
  // Review state
  const [review, setReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STATIC_URL}${url}`;
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order?.STATUS === 'completed') {
      fetchReview();
    }
  }, [order?.STATUS]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setRevisions(data.data.REVISIONS || []);
        setDeliveries(data.data.DELIVERIES || []);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch review from client
  const fetchReview = async () => {
    setLoadingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reviews/order/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Review response:', data);
      
      if (data.success && data.data) {
        setReview(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch review:', error);
    } finally {
      setLoadingReview(false);
    }
  };

  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/orders/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      return data.data;
    }
    return null;
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    
    const uploadedFiles = [];
    for (const file of files) {
      const result = await uploadFileToServer(file);
      if (result) {
        uploadedFiles.push(result);
      }
    }
    
    setAttachments([...attachments, ...uploadedFiles]);
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmitDelivery = async () => {
    if (!deliveryMessage.trim()) {
      alert('Mohon isi pesan untuk client');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/orders/${id}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: deliveryMessage,
          attachments: attachments
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Hasil pekerjaan berhasil dikirim!');
        navigate('/orders');
      } else {
        alert(data.message || 'Gagal mengirim hasil pekerjaan');
      }
    } catch (error) {
      console.error('Delivery failed:', error);
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Menunggu Diproses', color: 'bg-blue-100 text-blue-700', icon: Clock },
      'in_progress': { label: 'Sedang Dikerjakan', color: 'bg-indigo-100 text-indigo-700', icon: RefreshCw },
      'waiting_approval': { label: 'Menunggu Review Client', color: 'bg-purple-100 text-purple-700', icon: MessageCircle },
      'revision': { label: 'Revisi Diminta', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
      'completed': { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'cancelled': { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100', icon: Clock };
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
      <div className="text-center py-20">
        <p className="text-gray-500">Order tidak ditemukan</p>
        <button onClick={() => navigate('/orders')} className="mt-4 text-emerald-600">
          Kembali ke Daftar Pesanan
        </button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.STATUS);
  const StatusIcon = statusBadge.icon;
  const isRevision = order.STATUS === 'revision';
  const canDeliver = order.STATUS === 'in_progress' || order.STATUS === 'revision';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/orders')} 
        className="flex items-center text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
      >
        ← Kembali ke Daftar Pesanan
      </button>

      {/* Order Info Card */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">ORDER #{order.ORDER_ID}</h1>
            <p className="text-gray-500 mt-1">{order.SERVICE_TITLE}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusBadge.color}>
                <StatusIcon className="w-3 h-3 inline mr-1" />
                {statusBadge.label}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Pembayaran</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(order.TOTAL_PRICE)}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar src={order.CLIENT_AVATAR} size="md" />
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-semibold">{order.CLIENT_NAME || 'Client'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{formatDateTime(order.CREATED_AT)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 🔥 REVIEW SECTION - Hanya tampil jika order selesai */}
      {order.STATUS === 'completed' && (
        <Card className="p-6 mb-6 border-t-4 border-t-yellow-400">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-900">Review dari Client</h3>
          </div>
          
          {loadingReview ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : review ? (
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Avatar src={order.CLIENT_AVATAR} size="sm" />
                  <div>
                    <p className="font-semibold text-gray-900">{order.CLIENT_NAME || 'Client'}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.CREATED_AT)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${star <= review.RATING ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{review.RATING}.0</span>
                </div>
              </div>
              <p className="text-gray-700 mt-2">{review.REVIEW_COMMENT || 'Tidak ada komentar'}</p>
              
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Client puas dengan hasil pekerjaan Anda!</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada review dari client</p>
              <p className="text-xs text-gray-400 mt-1">Client akan memberikan review setelah order selesai</p>
            </div>
          )}
        </Card>
      )}

      {/* Riwayat Revisi */}
      {revisions.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-500" />
            Riwayat Revisi
          </h3>
          <div className="space-y-3">
            {revisions.map((rev, idx) => (
              <div key={idx} className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                <p className="text-sm text-orange-800">{rev.DESCRIPTION}</p>
                <p className="text-xs text-orange-500 mt-1">{formatDateTime(rev.REQUESTED_AT)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Form Kirim Hasil */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          {isRevision ? (
            <RefreshCw className="w-5 h-5 text-orange-600" />
          ) : (
            <Upload className="w-5 h-5 text-emerald-600" />
          )}
          <h2 className="text-xl font-bold text-gray-900">
            {isRevision ? 'Kirim Ulang Hasil Revisi' : 'Kirim Hasil Pekerjaan'}
          </h2>
        </div>

        {!canDeliver ? (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              Status order: <strong>{statusBadge.label}</strong>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {order.STATUS === 'waiting_approval' 
                ? 'Menunggu review dari client' 
                : order.STATUS === 'completed'
                  ? 'Pesanan sudah selesai'
                  : 'Belum bisa mengirim hasil'}
            </p>
          </div>
        ) : (
          <>
            {/* Delivery Message */}
            <div className="mb-4">
              <label className="block font-bold text-gray-900 mb-2">
                Pesan untuk Client <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={4}
                placeholder={isRevision 
                  ? "Jelaskan perubahan yang sudah Anda perbaiki sesuai revisi..." 
                  : "Jelaskan hasil pekerjaan Anda..."}
                value={deliveryMessage}
                onChange={(e) => setDeliveryMessage(e.target.value)}
              />
            </div>

            {/* File Attachments */}
            <div className="mb-6">
              <label className="block font-bold text-gray-900 mb-2">Lampiran File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="fileInput"
                  disabled={uploading}
                />
                <label htmlFor="fileInput" className="cursor-pointer block">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">
                    {uploading ? 'Mengupload...' : 'Klik untuk upload file'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Maksimal 10MB per file</p>
                </label>
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">File terlampir:</p>
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <a href={getFullImageUrl(att.url)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:underline">
                          {att.name}
                        </a>
                      </div>
                      <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              fullWidth
              size="lg"
              onClick={handleSubmitDelivery}
              disabled={submitting || !deliveryMessage.trim()}
              className={isRevision ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRevision ? <RefreshCw className="w-5 h-5 mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
                  {isRevision ? 'Kirim Ulang Hasil Revisi' : 'Kirim Hasil Pekerjaan'}
                </>
              )}
            </Button>

            {/* Tips */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 {isRevision 
                  ? 'Pastikan Anda sudah memperbaiki semua yang diminta client sebelum mengirim ulang.'
                  : 'Setelah dikirim, client akan review hasil pekerjaan Anda.'}
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default FreelancerOrderTrackView;