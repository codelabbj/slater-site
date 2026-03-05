'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, RefreshCw, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { notificationApi } from '@/lib/api-client';
import { Notification } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { fcmService } from '@/lib/firebase';
import type { MessagePayload } from 'firebase/messaging';

// Extended notification type to include FCM notifications
interface FCMNotification {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  is_fcm: true;
  payload?: MessagePayload;
}

type CombinedNotification = Notification | FCMNotification;

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fcmNotifications, setFcmNotifications] = useState<FCMNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setIsRefreshing(pageNum === 1);
      setIsLoading(pageNum === 1);
      
      const response = await notificationApi.getAll(pageNum);
      
      setNotifications(response.results);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Échec du chargement des notifications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchNotifications(page);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [page]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFcmNotifications = localStorage.getItem('fcm_notifications');
      if (storedFcmNotifications) {
        try {
          const parsed = JSON.parse(storedFcmNotifications);
          setFcmNotifications(parsed);
        } catch (error) {
          console.error('Error loading FCM notifications from storage:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFCMMessage = (payload: MessagePayload) => {
      console.log('FCM notification received in notifications page:', payload);
      
      const fcmNotification: FCMNotification = {
        id: `fcm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: payload.notification?.title || 'Nouvelle notification',
        content: payload.notification?.body || payload.data?.body || 'Vous avez une nouvelle notification',
        created_at: new Date().toISOString(),
        is_read: false,
        is_fcm: true,
        payload: payload,
      };

      setFcmNotifications(prev => {
        const updated = [fcmNotification, ...prev];
        localStorage.setItem('fcm_notifications', JSON.stringify(updated));
        return updated;
      });

      try {
        if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) {
          console.warn('Notification API not available');
          return;
        }
        
        const permission = window.Notification?.permission;
        if (permission !== 'granted') {
          console.warn('Notification permission not granted:', permission);
          return;
        }
        
        const notification = new window.Notification(fcmNotification.title, {
          body: fcmNotification.content,
          icon: '/placeholder-logo.png',
          badge: '/placeholder-logo.png',
          tag: fcmNotification.id,
          requireInteraction: false,
        });

        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          
          if (payload.data?.url) {
            window.open(payload.data.url, '_blank');
          }
          
          notification.close();
        };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    };

    fcmService.setupForegroundListener(handleFCMMessage);

    if ('serviceWorker' in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.firebaseMessaging) {
          const payload = event.data.firebaseMessaging;
          handleFCMMessage(payload);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
  }, []);

  const markAsRead = async (notificationId: number | string) => {
    if (typeof notificationId === 'string' && notificationId.startsWith('fcm-')) {
      setFcmNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      
      const updated = fcmNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      );
      localStorage.setItem('fcm_notifications', JSON.stringify(updated));
      
      toast.success('Notification marquée comme lue');
      return;
    }

    try {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      toast.success('Notification marquée comme lue');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Échec de la mise à jour de la notification');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP p', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const allNotifications: CombinedNotification[] = [
    ...fcmNotifications,
    ...notifications,
  ].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Back Button */}
      <div className="flex items-center justify-start">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 h-8 px-3 hover:bg-primary/10 text-muted-foreground hover:text-foreground text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-background border backdrop-blur-sm shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 bg-primary" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centre de notifications
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground px-2.5 py-1 text-xs font-semibold rounded-lg">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">
          <div className="w-1.5 h-5 bg-primary rounded-full" />
          Toutes les notifications
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNotifications()}
          disabled={isRefreshing}
          className="h-8 px-3 text-xs rounded-xl"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Actualisation...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Actualiser
            </>
          )}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="relative overflow-hidden rounded-2xl p-12 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 bg-primary" />
          <div className="relative flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      ) : allNotifications.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 bg-primary" />
          <div className="relative flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold">Aucune notification</p>
            <p className="text-xs text-muted-foreground mt-1">
              Vous serez notifié dès qu'il y aura du nouveau
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {allNotifications.map((notification) => {
              const isFCM = 'is_fcm' in notification && notification.is_fcm;
              
              return (
                <div
                  key={notification.id}
                  className={`relative overflow-hidden rounded-xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                    isFCM 
                      ? 'bg-gradient-to-br from-blue-50/80 via-blue-50/50 to-background dark:from-blue-950/20 dark:via-blue-950/10 dark:to-background border border-blue-200/50 dark:border-blue-800/30' 
                      : 'bg-gradient-to-br from-background via-muted/20 to-background border border-border/50 hover:border-primary/30'
                  } ${!notification.is_read ? 'ring-1 ring-primary/20' : ''}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 to-transparent" />
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10" style={{ background: isFCM ? '#3B82F6' : 'var(--primary)' }} />
                  
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${
                        isFCM ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-primary/15 text-primary'
                      }`}>
                        {isFCM ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        {isFCM && (
                          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[10px] px-1.5 py-0.5 rounded">
                            Push
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="h-8 px-2 text-xs rounded-lg hover:bg-primary/10 flex-shrink-0"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Lu
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {(hasNext || hasPrevious) && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchNotifications(page - 1)}
                disabled={!hasPrevious || isLoading}
                className="h-8 px-3 text-xs rounded-xl"
              >
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                Page {page}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchNotifications(page + 1)}
                disabled={!hasNext || isLoading}
                className="h-8 px-3 text-xs rounded-xl"
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}