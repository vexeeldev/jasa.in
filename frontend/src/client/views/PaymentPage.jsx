import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_BASE_URL = 'https://mollusklike-intactly-kennedi.ngrok-free.dev/api';

const PaymentPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/payments/payment-confirm/${token}`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.close(); // atau redirect
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pembayaran Berhasil!</h1>
          <p className="text-gray-500">Terima kasih, pesanan Anda telah dikonfirmasi</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="text-center mb-6">
          <CreditCard className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold">Konfirmasi Pembayaran</h1>
          <p className="text-gray-500 text-sm">Klik tombol di bawah untuk konfirmasi</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <Button 
          fullWidth 
          onClick={handleConfirmPayment}
          disabled={loading}
          className="py-3"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            'Konfirmasi Bayar Sekarang'
          )}
        </Button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Pastikan Anda sudah melakukan pembayaran sebelum konfirmasi
        </p>
      </Card>
    </div>
  );
};

export default PaymentPage;