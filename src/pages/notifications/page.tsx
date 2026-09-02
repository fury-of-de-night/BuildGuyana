import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  is_broadcast: boolean;
  sender_name: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}

function NotificationsContent() {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},is_broadcast.eq.true`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNotifications((data || []) as Notification[]);
    } catch (err: unknown) {
      console.error('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (updateError) throw updateError;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (updateError) throw updateError;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      setToast('All notifications marked as read');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[100] bg-foreground-900 text-background-50 rounded-md px-5 py-3 shadow-sm max-w-md text-center top-20 md:top-24">
          <p className="text-sm font-label">{toast}</p>
        </div>
      )}

      <main className={`flex-1 px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-12`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
                Notifications
              </h1>
              <p className="text-foreground-600 text-sm mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-check-double-line" />
                </div>
                Mark All as Read ({unreadCount})
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-foreground-600 mb-4">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-primary-500 text-background-50 text-sm font-label font-medium rounded-md cursor-pointer whitespace-nowrap"
              >
                Try Again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 bg-white border border-background-200/70 rounded-lg">
              <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                <i className="ri-notification-off-line text-3xl text-foreground-400" />
              </div>
              <p className="text-foreground-600 text-sm">No notifications yet.</p>
              <p className="text-foreground-500 text-xs mt-1">
                You'll see job updates, review notifications, and more here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                  className={`bg-white border rounded-lg p-4 transition-colors ${
                    n.is_read
                      ? 'border-background-200/70'
                      : 'border-primary-300/60 bg-primary-50/30 cursor-pointer hover:bg-primary-50/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {n.sender_name && (
                        <p className="text-[10px] font-label font-medium text-foreground-400 mb-0.5">
                          From: {n.sender_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                        )}
                        <h3 className="font-label text-sm font-semibold text-foreground-900">
                          {n.title}
                        </h3>
                        {markingId === n.id && (
                          <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-foreground-600 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-xs text-foreground-400 mt-1.5">
                        {formatTimeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="text-xs text-primary-600 font-label whitespace-nowrap shrink-0">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}