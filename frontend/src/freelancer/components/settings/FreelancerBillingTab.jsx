import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign, History } from 'lucide-react';
import Button from '../../components/ui/Button';

const FreelancerBillingTab = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900 mb-1">Penagihan & Pajak</h2>
        <p className="text-sm text-gray-500">Kelola informasi penagihan dan tarik dana</p>
      </div>

      {/* Withdrawal Info */}
      <div className="mb-6 p-5 bg-emerald-50 rounded-xl border border-emerald-100">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          <h3 className="font-black text-gray-900">Tarik Pendapatan</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">Tarik saldo Anda ke rekening bank</p>
        <Button variant="outline" onClick={() => navigate('/client/wallet')}>
          Kelola Penarikan
        </Button>
      </div>

      {/* Payment Methods */}
      <div className="mb-6 p-5 bg-gray-50 rounded-xl">
        <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          Metode Pembayaran
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">BCA</div>
              <div>
                <p className="font-bold text-gray-900">Bank Central Asia</p>
                <p className="text-xs text-gray-500">****1234</p>
              </div>
            </div>
            <Badge variant="success">Default</Badge>
          </div>
          <Button variant="ghost" size="sm" className="w-full">
            + Tambah Rekening Bank
          </Button>
        </div>
      </div>

      {/* Tax Info */}
      <div className="p-5 bg-gray-50 rounded-xl">
        <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-500" />
          Riwayat Transaksi
        </h3>
        <p className="text-sm text-gray-500 mb-4">Lihat semua riwayat pembayaran dan penarikan</p>
        <Button variant="secondary" onClick={() => navigate('/client/wallet')}>
          Lihat Riwayat Transaksi
        </Button>
      </div>
    </div>
  );
};

const Badge = ({ variant, children }) => {
  const variants = { success: 'bg-green-100 text-green-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${variants[variant]}`}>{children}</span>;
};

export default FreelancerBillingTab;