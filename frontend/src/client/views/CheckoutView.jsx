import React, { useState } from 'react';
import { CreditCard, Shield, Paperclip, Wallet, Building2, QrCode, AlertCircle, ChevronRight, Clock, FileText } from 'lucide-react';
import { DB_SERVICE_PACKAGES, DB_SERVICES } from '../data/mockDatabase';
import { formatCurrency } from '../data/helpers';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Textarea from '../components/ui/Textarea';
import { useAuth } from '../../App'; // Import auth context

const ClientCheckoutView = ({ navigate, viewParams }) => {
  const { currentUser } = useAuth();
  const packageId = viewParams?.packageId || 803;
  const pkg = DB_SERVICE_PACKAGES.find(p => p.package_id === packageId);
  const service = DB_SERVICES.find(s => s.service_id === pkg?.service_id);
  
  const [selectedPayment, setSelectedPayment] = useState('balance');
  const [requirements, setRequirements] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!pkg || !service) return <div className="p-20 text-center font-bold text-xl text-gray-500">Paket tidak ditemukan</div>;

  const serviceFee = pkg.price * 0.05;
  const total = pkg.price + serviceFee;
  const userBalance = currentUser?.balance || 0;
  const hasEnoughBalance = userBalance >= total;

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

    if (selectedPayment === 'balance' && !hasEnoughBalance) {
      alert('Saldo tidak mencukupi. Silakan pilih metode pembayaran lain atau top up saldo terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    
    // Simulasi proses pembayaran
    setTimeout(() => {
      // TODO: Kirim data ke backend
      // - order data
      // - requirements
      // - attachments
      // - payment method
      
      setIsProcessing(false);
      navigate('/client/orders'); // Redirect ke daftar pesanan client
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate('/client/explore')}>
          Cari Jasa
        </span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate(`/client/service/${service.service_id}`)}>
          {service.title.substring(0, 30)}...
        </span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-emerald-600 font-semibold">Checkout</span>
      </div>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Checkout Pesanan</h1>
      <p className="text-gray-600 mb-8">Isi detail pesanan Anda dengan lengkap agar freelancer dapat mengerjakan sesuai kebutuhan</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
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
              id="requirements"
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
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileAttachment}
                />
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
              {/* Saldo Jasa.in */}
              <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPayment === 'balance' 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="balance"
                  checked={selectedPayment === 'balance'}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 h-5 w-5"
                />
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <Wallet className="w-5 h-5 text-gray-700 mr-2" />
                        <span className="font-bold text-gray-900">Saldo Jasa.in</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Sisa saldo: {formatCurrency(userBalance)}</p>
                    </div>
                    {!hasEnoughBalance && selectedPayment === 'balance' && (
                      <div className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Saldo tidak mencukupi
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* Bank Transfer */}
              <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPayment === 'bank_transfer' 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="bank_transfer"
                  checked={selectedPayment === 'bank_transfer'}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 h-5 w-5"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-700 mr-2" />
                    <span className="font-bold text-gray-900">Transfer Bank</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">BCA, Mandiri, BRI, BNI, Permata</p>
                </div>
              </label>

              {/* QRIS */}
              <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPayment === 'qris' 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="qris"
                  checked={selectedPayment === 'qris'}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 h-5 w-5"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <QrCode className="w-5 h-5 text-gray-700 mr-2" />
                    <span className="font-bold text-gray-900">QRIS</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Scan menggunakan aplikasi mobile banking</p>
                </div>
              </label>
            </div>

            {/* Payment Note */}
            {selectedPayment !== 'balance' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start">
                <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Anda akan diarahkan ke halaman pembayaran setelah mengkonfirmasi pesanan. 
                  Pesanan akan diproses setelah pembayaran kami terima.
                </p>
              </div>
            )}
          </Card>

          {/* Terms Agreement */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              Saya menyetujui <a href="/terms" className="text-emerald-600 hover:underline">Syarat dan Ketentuan</a> serta 
              <a href="/privacy" className="text-emerald-600 hover:underline ml-1">Kebijakan Privasi</a> Jasa.in
            </label>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:w-1/3">
          <Card className="sticky top-28 p-6 border-2 border-gray-200">
            <h3 className="font-black text-gray-900 text-lg mb-4">Ringkasan Pesanan</h3>
            
            {/* Service Info */}
            <div className="flex mb-4 pb-4 border-b border-gray-200">
              <img 
                src={service.thumbnail_url} 
                className="w-20 h-16 object-cover rounded-md mr-3 border border-gray-200" 
                alt={service.title}
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 line-clamp-2">{service.title}</p>
                <div className="mt-1">
                  <Badge variant="purple" size="sm">{pkg.package_name}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  oleh: <span className="font-medium">{service.freelancer_name}</span>
                </p>
              </div>
            </div>

            {/* Package Details */}
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paket {pkg.package_name}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(pkg.price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Biaya Layanan</span>
                <span className="font-semibold text-gray-900">{formatCurrency(serviceFee)}</span>
              </div>
              {pkg.delivery_time && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Estimasi Pengerjaan
                  </span>
                  <span className="font-semibold text-gray-900">{pkg.delivery_time} hari</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-6">
              <span className="font-black text-gray-900 text-base">Total Pembayaran</span>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600">{formatCurrency(total)}</span>
                <p className="text-xs text-gray-500">termasuk pajak & layanan</p>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <div className="flex items-start">
                <Shield className="w-4 h-4 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold">Pembayaran 100% Aman</span><br />
                  Dana akan ditahan oleh Jasa.in dan baru dicairkan ke freelancer setelah Anda menyetujui hasil pekerjaan.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              size="lg" 
              fullWidth 
              onClick={handleSubmitOrder}
              disabled={isProcessing || !agreedToTerms || !requirements.trim() || (selectedPayment === 'balance' && !hasEnoughBalance)}
              className="relative"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Memproses...
                </div>
              ) : (
                `Pesan Sekarang - ${formatCurrency(total)}`
              )}
            </Button>

            {/* Payment Reminder */}
            {selectedPayment !== 'balance' && (
              <p className="text-xs text-center text-gray-400 mt-4">
                *Setelah pesan, Anda akan mendapatkan instruksi pembayaran
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientCheckoutView;