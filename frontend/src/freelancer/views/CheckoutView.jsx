import React from 'react';
import { CreditCard, Shield, Paperclip } from 'lucide-react';
import { DB_SERVICE_PACKAGES, DB_SERVICES } from '../data/mockDatabase';
import { formatCurrency } from '../data/helpers';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Textarea from '../components/ui/Textarea';

const CheckoutView = ({ navigate, viewParams }) => {
  const packageId = viewParams?.packageId || 803;
  const pkg       = DB_SERVICE_PACKAGES.find(p => p.package_id === packageId);
  const service   = DB_SERVICES.find(s => s.service_id === pkg?.service_id);

  if (!pkg || !service) return <div className="p-20 text-center font-bold text-xl text-gray-500">Invalid Checkout</div>;

  const serviceFee = pkg.price * 0.05;
  const total      = pkg.price + serviceFee;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8">Selesaikan Pesanan Anda</h1>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3 space-y-6">

          <Card>
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-200">Kebutuhan Pesanan (Requirements)</h2>
            <p className="text-sm text-gray-600 mb-4 font-medium">Berikan instruksi yang jelas kepada freelancer agar proyek berjalan lancar.</p>
            <Textarea
              id="requirements"
              rows={5}
              placeholder="Deskripsikan kebutuhan Anda secara detail..."
            />
            <div className="flex items-center text-sm text-gray-500 cursor-pointer hover:text-emerald-600">
              <Paperclip className="w-4 h-4 mr-2" /> Lampirkan file pendukung (opsional)
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-200">Metode Pembayaran</h2>
            <div className="space-y-4">
              <label className="flex items-center p-5 border-2 border-emerald-500 bg-emerald-50 rounded-xl cursor-pointer shadow-sm">
                <input type="radio" name="payment" className="text-emerald-600 focus:ring-emerald-500 h-5 w-5" defaultChecked />
                <div className="ml-4 flex-1 flex justify-between items-center">
                  <div>
                    <span className="block text-base font-black text-gray-900">Saldo Jasa.in</span>
                    <span className="block text-sm text-gray-500 font-medium">Tersedia: {formatCurrency(14500000)}</span>
                  </div>
                  <CreditCard className="text-emerald-600 w-8 h-8 opacity-50" />
                </div>
              </label>

              <label className="flex items-center p-5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" name="payment" className="text-emerald-600 focus:ring-emerald-500 h-5 w-5" />
                <div className="ml-4 flex-1 flex justify-between items-center">
                  <span className="block text-base font-black text-gray-900">Virtual Account (Bank Transfer)</span>
                </div>
              </label>
            </div>
          </Card>
        </div>

        {/* Summary */}
        <div className="md:w-1/3">
          <Card className="sticky top-28 bg-gray-50/50 border-2 border-gray-200">
            <div className="flex items-start mb-6">
              <img src={service.thumbnail_url} className="w-24 h-16 object-cover rounded-md mr-4 border border-gray-200 shadow-sm" alt="" />
              <div>
                <p className="text-sm text-gray-900 font-bold leading-tight line-clamp-2">{service.title}</p>
                <Badge variant="purple" className="mt-2">{pkg.package_name}</Badge>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Harga Paket</span>
                <span className="text-gray-900">{formatCurrency(pkg.price)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Biaya Layanan (5%)</span>
                <span className="text-gray-900">{formatCurrency(serviceFee)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="font-black text-gray-900 text-lg">Total Pembayaran</span>
                <span className="text-2xl font-black text-emerald-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-8">
              <Button size="lg" fullWidth onClick={() => navigate('orders')}>Konfirmasi & Bayar</Button>
              <div className="flex items-start mt-4 text-gray-400">
                <Shield className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed font-medium">
                  Dana Anda akan disimpan di rekening bersama Jasa.in dan baru dicairkan setelah Anda menyetujui hasil akhir.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;