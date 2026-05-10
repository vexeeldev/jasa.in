import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Paperclip, Wallet, Building2, QrCode, AlertCircle, ChevronRight, Clock, FileText, Loader2 } from 'lucide-react';
import { formatCurrency } from '../data/helpers';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Textarea from '../components/ui/Textarea';
import { useAuth } from '../../App';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientCheckoutView = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [packageData, setPackageData] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [balance, setBalance] = useState(0);
  
  const [selectedPayment, setSelectedPayment] = useState('balance');
  const [requirements, setRequirements] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    fetchBalance();
  }, [packageId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Ambil semua services (dengan limit besar)
      const servicesRes = await fetch(`${API_BASE_URL}/services?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const servicesData = await servicesRes.json();
      
      if (servicesData.success) {
        // Cari package berdasarkan packageId
        let foundPackage = null;
        let foundService = null;
        
        for (const service of servicesData.data) {
          const pkg = service.PACKAGES?.find(p => p.PACKAGE_ID === parseInt(packageId));
          if (pkg) {
            foundPackage = pkg;
            foundService = service;
            break;
          }
        }
        
        if (foundPackage) {
          setPackageData(foundPackage);
          setServiceData(foundService);
        }
      }
    } catch (error) {
      console.error('Failed to fetch checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payments/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const handleSubmitOrder = async () => {
    if (!requirements.trim()) {
      alert('Mohon isi detail kebutuhan pesanan Anda');
      return;
    }
    
    if (!agreedToTerms) {
      alert('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    if (selectedPayment === 'balance' && balance < (packageData?.PRICE || 0)) {
      alert('Saldo tidak mencukupi. Silakan top up terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: parseInt(packageId),
          requirements: requirements,
          payment_method: selectedPayment
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
          // 🔥 Jika pakai saldo, langsung ke orders
        if (selectedPayment === 'balance') {
          navigate('/client/orders');
        } 
        // 🔥 Jika bank transfer / qris, ke halaman instruksi
        else {
          navigate('/client/payment-instruction', {
            state: {
              orderId: data.data.order_id,
              amount: data.data.total_price,
              method: selectedPayment,
              paymentToken: data.data.payment_token
            }
          });
        }
      } else {
        alert(data.message || 'Gagal membuat pesanan');
      }
    } catch (error) {
      console.error('Order failed:', error);
      alert('Terjadi kesalahan, silakan coba lagi');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!packageData || !serviceData) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Paket Tidak Ditemukan</h2>
        <button onClick={() => navigate('/client/explore')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
          Kembali ke Explore
        </button>
      </div>
    );
  }

  const serviceFee = packageData.PRICE * 0.05;
  const total = packageData.PRICE + serviceFee;
  const hasEnoughBalance = balance >= total;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate('/client/explore')}>
          Cari Jasa
        </span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate(`/client/service/${serviceData.SERVICE_ID}`)}>
          {serviceData.TITLE?.substring(0, 30)}...
        </span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-emerald-600 font-semibold">Checkout</span>
      </div>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Checkout Pesanan</h1>
      <p className="text-gray-600 mb-8">Isi detail pesanan Anda dengan lengkap</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="lg:w-2/3 space-y-6">
          
          {/* Requirements Section */}
          <Card className="p-6">
            <div className="flex items-start mb-4">
              <FileText className="w-6 h-6 text-emerald-600 mr-3 mt-0.5" />
              <div>
                <h2 className="text-xl font-black text-gray-900">Detail Kebutuhan Proyek</h2>
                <p className="text-sm text-gray-500 mt-1">Semakin detail instruksi Anda, semakin baik hasil yang akan didapat</p>
              </div>
            </div>
            
            <Textarea
              rows={6}
              placeholder={`Contoh detail kebutuhan:
• Jenis desain yang diinginkan
• Warna yang disukai
• Referensi atau contoh yang diinginkan
• Format file akhir yang diharapkan
• Deadline pengerjaan (opsional)`}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="mb-4"
            />
            
            {/* File Attachment */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-400 transition-colors">
              <label className="cursor-pointer block">
                <input type="file" multiple className="hidden" onChange={handleFileAttachment} />
                <div className="flex items-center justify-center text-gray-500">
                  <Paperclip className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Lampirkan file pendukung</span>
                  <span className="text-xs text-gray-400 ml-2">(max 10MB per file)</span>
                </div>
              </label>
              {attachments.length > 0 && (
                <div className="mt-3 space-y-1">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-center">
                      <Paperclip className="w-3 h-3 mr-1" />
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Payment Method Section */}
          <Card className="p-6">
            <div className="flex items-start mb-4">
              <CreditCard className="w-6 h-6 text-emerald-600 mr-3 mt-0.5" />
              <div>
                <h2 className="text-xl font-black text-gray-900">Metode Pembayaran</h2>
                <p className="text-sm text-gray-500 mt-1">Pilih metode pembayaran yang paling nyaman untuk Anda</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPayment === 'balance' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <input type="radio" name="payment" value="balance" checked={selectedPayment === 'balance'}
                  onChange={(e) => setSelectedPayment(e.target.value)} className="mt-1" />
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <Wallet className="w-5 h-5 text-gray-700 mr-2" />
                    <span className="font-bold">Saldo Jasa.in</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Sisa saldo: {formatCurrency(balance)}</p>
                  {!hasEnoughBalance && selectedPayment === 'balance' && (
                    <div className="text-red-500 text-xs flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" /> Saldo tidak mencukupi
                    </div>
                  )}
                </div>
              </label>

              <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPayment === 'bank_transfer' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <input type="radio" name="payment" value="bank_transfer" checked={selectedPayment === 'bank_transfer'}
                  onChange={(e) => setSelectedPayment(e.target.value)} className="mt-1" />
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-700 mr-2" />
                    <span className="font-bold">Transfer Bank</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">BCA, Mandiri, BRI, BNI, Permata</p>
                </div>
              </label>

              <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer ${
                selectedPayment === 'qris' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}>
                <input type="radio" name="payment" value="qris" checked={selectedPayment === 'qris'}
                  onChange={(e) => setSelectedPayment(e.target.value)} className="mt-1" />
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <QrCode className="w-5 h-5 text-gray-700 mr-2" />
                    <span className="font-bold">QRIS</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Scan menggunakan aplikasi mobile banking</p>
                </div>
              </label>
            </div>
          </Card>

          {/* Terms Agreement */}
          <div className="flex items-start space-x-3">
            <input type="checkbox" id="terms" checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1" />
            <label htmlFor="terms" className="text-sm text-gray-600">
              Saya menyetujui <a href="/terms" className="text-emerald-600 hover:underline">Syarat dan Ketentuan</a> Jasa.in
            </label>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:w-1/3">
          <Card className="sticky top-28 p-6">
            <h3 className="font-black text-lg mb-4">Ringkasan Pesanan</h3>
            
            <div className="flex mb-4 pb-4 border-b">
              <img src={serviceData.THUMBNAIL_URL || 'https://placehold.co/80x60'} className="w-20 h-16 object-cover rounded-md mr-3" alt="" />
              <div>
                <p className="text-sm font-bold line-clamp-2">{serviceData.TITLE}</p>
                <Badge variant="purple" size="sm" className="mt-1">{packageData.PACKAGE_NAME}</Badge>
              </div>
            </div>

            <div className="space-y-2 mb-4 pb-4 border-b">
              <div className="flex justify-between text-sm">
                <span>Paket {packageData.PACKAGE_NAME}</span>
                <span className="font-bold">{formatCurrency(packageData.PRICE)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Biaya Layanan (5%)</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Estimasi</span>
                <span>{packageData.DELIVERY_DAYS} hari</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="font-black">Total Pembayaran</span>
              <span className="text-2xl font-black text-emerald-600">{formatCurrency(total)}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <div className="flex items-start">
                <Shield className="w-4 h-4 text-emerald-600 mr-2 mt-0.5" />
                <p className="text-xs text-gray-600">Dana akan ditahan oleh Jasa.in hingga Anda menyetujui hasil pekerjaan.</p>
              </div>
            </div>

            <Button fullWidth onClick={handleSubmitOrder} disabled={isProcessing || !agreedToTerms || !requirements.trim() || (selectedPayment === 'balance' && !hasEnoughBalance)}>
              {isProcessing ? 'Memproses...' : `Pesan Sekarang - ${formatCurrency(total)}`}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientCheckoutView;