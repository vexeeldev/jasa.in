import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertCircle, Package, DollarSign, Star, X, Loader2, MessageCircle, Truck } from 'lucide-react';
import { formatDateTime } from '../data/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientNotificationsView = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notifications/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.data.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => 
        n.NOTIF_ID === notifId ? { ...n, IS_READ: '1' } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/notifications/read/all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, IS_READ: '1' })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/notifications/${notifId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.NOTIF_ID !== notifId));
      if (notifications.find(n => n.NOTIF_ID === notifId)?.IS_READ === '0') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5 text-emerald-500" />;
      case 'cancellation': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'delivery': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'revision': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'review': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'wallet': return <DollarSign className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notif) => {
    // Tandai sudah dibaca
    if (notif.IS_READ === '0') {
      markAsRead(notif.NOTIF_ID);
    }
    
    // Navigasi berdasarkan type
    if (notif.TYPE === 'order' || notif.TYPE === 'delivery' || notif.TYPE === 'revision' || notif.TYPE === 'completed') {
      // Ambil order_id dari body jika ada
      const orderMatch = notif.BODY.match(/#(\d+)/);
      if (orderMatch) {
        navigate(`/client/order-track/${orderMatch[1]}`);
      }
    } else if (notif.TYPE === 'wallet') {
      navigate('/client/wallet');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Notifikasi</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount} notifikasi belum dibaca
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-16">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Notifikasi</h3>
          <p className="text-gray-500">Akan ada notifikasi saat ada aktivitas baru</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.NOTIF_ID}
              onClick={() => handleNotificationClick(notif)}
              className={`bg-white border rounded-xl p-4 transition-all hover:shadow-md cursor-pointer ${
                notif.IS_READ === '0' ? 'border-l-4 border-l-emerald-500 bg-emerald-50/20' : 'border-gray-200'
              }`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {getIcon(notif.TYPE)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-bold ${notif.IS_READ === '0' ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notif.TITLE}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{notif.BODY}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDateTime(notif.CREATED_AT)}</p>
                    </div>
                    <div className="flex gap-2">
                      {notif.IS_READ === '0' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.NOTIF_ID);
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.NOTIF_ID);
                        }}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientNotificationsView;