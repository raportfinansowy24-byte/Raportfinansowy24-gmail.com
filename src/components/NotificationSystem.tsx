import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { supabase, isSupabaseConfigured, getIsSupabaseAvailable, setSupabaseUnreachable } from '../lib/supabase';

export interface AppNotification {
  id: string;
  created_at: string;
  title: string;
  message: string;
  read: boolean;
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only attempt to connect if Supabase is properly configured and reachable
    if (!getIsSupabaseAvailable()) return;

    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const updatedNotification = payload.new as AppNotification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const fetchNotifications = async () => {
    if (!getIsSupabaseAvailable()) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (error.message?.includes('fetch failed')) {
          setSupabaseUnreachable();
          return;
        }
        // Silently handle missing table error
        if (error.code === 'PGRST205' || error.message?.includes('relation "notifications" does not exist')) {
          return;
        }
        throw error;
      }
      if (data) setNotifications(data);
    } catch (error: any) {
      if (error.message?.includes('fetch failed')) {
        setSupabaseUnreachable();
      } else {
        // Only log unexpected errors
        console.error('Error fetching notifications:', error);
      }
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      if (!getIsSupabaseAvailable()) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error?.message?.includes('fetch failed')) {
        setSupabaseUnreachable();
      }
    } catch (error: any) {
      if (error.message?.includes('fetch failed')) {
        setSupabaseUnreachable();
      } else {
        console.error('Error marking as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      if (!getIsSupabaseAvailable()) return;

      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error?.message?.includes('fetch failed')) {
        setSupabaseUnreachable();
      }
    } catch (error: any) {
      if (error.message?.includes('fetch failed')) {
        setSupabaseUnreachable();
      } else {
        console.error('Error marking all as read:', error);
      }
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DC143C] rounded-full border border-black animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 max-h-[400px] bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
              <h3 className="text-sm font-bold text-white">Powiadomienia</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-[#DC143C] hover:text-white transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Oznacz wszystkie jako przeczytane
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-white/40 text-xs">
                  Brak nowych powiadomień
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      notification.read
                        ? 'bg-white/5 border-transparent opacity-60'
                        : 'bg-[#DC143C]/10 border-[#DC143C]/30 hover:border-[#DC143C]/60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-xs font-bold ${notification.read ? 'text-white/70' : 'text-white'}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DC143C] mt-1 flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/60 leading-tight">
                      {notification.message}
                    </p>
                    <span className="text-[8px] text-white/30 mt-2 block">
                      {new Date(notification.created_at).toLocaleString('pl-PL')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
