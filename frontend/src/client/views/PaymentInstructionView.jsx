import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, QrCode, Copy, CheckCircle, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatCurrency } from '../data/helpers';

const API_BASE_URL = 'http://localhost:5000/api';

const PaymentInstructionView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, amount, method, paymentToken } = location.state || {};
  
  const [paymentStatus, setPaymentStatus] = useState('waiting');
  const [pollingCount, setPollingCount] = useState(0);

  // 🔥 CEK APAKAH AKSES MANUAL (tanpa state dari checkout)
  useEffect(() => {
    // Jika tidak ada state dari navigasi (akses manual via URL), redirect ke orders
    if (!location.state) {
      navigate('/client/orders', { replace: true });
      return;
    }
    
    // Jika ada state tapi method qris, cek status order
    if (method === 'qris' && orderId) {
      checkOrderStatus();
    }
  }, [location.state]);

  const checkOrderStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      // Jika order sudah bukan waiting_payment, redirect ke orders
      if (data.data?.STATUS !== 'waiting_payment') {
        navigate('/client/orders', { replace: true });
      }
    } catch (error) {
      console.error('Check order status error:', error);
    }
  };

  // 🔥 Polling setiap 3 detik untuk cek status pembayaran
  useEffect(() => {
    if (method !== 'qris') return;
    
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/payments/payment-status/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.status === 'pending' || data.status === 'in_progress') {
          clearInterval(interval);
          setPaymentStatus('success');
          // 🔥 Redirect dengan replace (tidak bisa back)
          setTimeout(() => {
            navigate('/client/orders', { replace: true });
          }, 2000);
        }
        
        setPollingCount(prev => prev + 1);
        if (pollingCount > 100) clearInterval(interval);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [orderId, method, pollingCount]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Berhasil disalin!');
  };

  // 🔥 Generate URL untuk QR Code
  const paymentUrl = paymentToken 
    ? `https://mollusklike-intactly-kennedi.ngrok-free.dev/client/pay/${paymentToken}`
    : null;

  if (!orderId || !amount || !method) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Informasi tidak lengkap</h2>
        <Button onClick={() => navigate('/client/orders', { replace: true })}>Lihat Pesanan Saya</Button>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pembayaran Berhasil! ✅</h2>
        <p className="text-gray-500 mb-6">Pesanan Anda sedang diproses</p>
        <Button onClick={() => navigate('/client/orders', { replace: true })}>Lihat Pesanan Saya</Button>
      </div>
    );
  }

  if (method === 'qris') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </button>

        <Card className="p-6 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Scan QRIS</h1>
          <p className="text-gray-500 mb-6">Scan QR code menggunakan HP Anda</p>

          {paymentUrl && (
            <div className="bg-white rounded-2xl p-4 mb-6 inline-block mx-auto shadow-md border border-gray-200">
              <QRCodeSVG value={paymentUrl} size={200} level="H" />
            </div>
          )}

          <div className="bg-emerald-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 uppercase">Total Pembayaran</p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(amount)}</p>
            <p className="text-xs text-gray-400 mt-1">Kode Pesanan: ORD-{orderId}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 mb-6 text-left">
            <p className="text-xs text-blue-600 font-medium mb-1">📝 Cara Pembayaran:</p>
            <p className="text-xs text-blue-700">
              1. Scan QR code dengan HP Anda<br />
              2. Akan terbuka halaman pembayaran<br />
              3. Klik "Konfirmasi Bayar" di HP<br />
              4. Halaman ini akan otomatis berubah
            </p>
          </div>

          <div className="text-center text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
            Menunggu pembayaran...
          </div>
        </Card>
      </div>
    );
  }

  // Bank Transfer
  if (method === 'bank_transfer') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </button>

        <Card className="p-6 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Transfer Bank</h1>
          <p className="text-gray-500 mb-6">Silakan transfer ke rekening berikut</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Nomor Rekening</p>
            <p className="text-2xl font-bold font-mono">1234 5678 9012 3456</p>
            <p className="text-sm text-gray-600 mt-1">a.n PT Jasa Inovasi Nusantara</p>
            <button onClick={() => copyToClipboard('1234567890123456')} className="mt-3 text-emerald-600 text-sm font-medium flex items-center gap-1">
              <Copy className="w-4 h-4" /> Salin nomor rekening
            </button>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 uppercase">Total Pembayaran</p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(amount)}</p>
            <p className="text-xs text-gray-400 mt-1">Kode Pesanan: ORD-{orderId}</p>
          </div>

          <Button fullWidth onClick={() => navigate('/client/orders', { replace: true })}>
            <CheckCircle className="w-4 h-4 mr-2" /> Saya sudah transfer
          </Button>
        </Card>
      </div>
    );
  }

  return null;
};

export default PaymentInstructionView;