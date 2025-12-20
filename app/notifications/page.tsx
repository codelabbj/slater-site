'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
  id: string; // Use timestamp + random for unique ID
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

  // Refetch data when the page gains focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      fetchNotifications(page);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [page]);

  // Load FCM notifications from localStorage on mount
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

  // Setup FCM foreground message listener
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

      // Add to state
      setFcmNotifications(prev => {
        const updated = [fcmNotification, ...prev];
        // Save to localStorage with the updated state
        localStorage.setItem('fcm_notifications', JSON.stringify(updated));
        return updated;
      });

      // Show native browser notification
      try {
        if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) {
          console.warn('Notification API not available');
          return;
        }
        
        // Check permission safely
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

        // Handle click on notification
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          
          // Navigate to notification details or handle custom data
          if (payload.data?.url) {
            window.open(payload.data.url, '_blank');
          }
          
          notification.close();
        };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    };

    // Setup listener
    fcmService.setupForegroundListener(handleFCMMessage);

    // Also listen for service worker messages (background notifications)
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
  }, []); // Empty dependency array - setup once

  const markAsRead = async (notificationId: number | string) => {
    // Check if it's an FCM notification (string ID)
    if (typeof notificationId === 'string' && notificationId.startsWith('fcm-')) {
      setFcmNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      
      // Update localStorage
      const updated = fcmNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      );
      localStorage.setItem('fcm_notifications', JSON.stringify(updated));
      
      toast.success('Notification marquée comme lue');
      return;
    }

    // Backend notification (number ID)
    try {
      // TODO: Implement mark as read API call if available
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

  // Combine backend and FCM notifications, sorted by date (newest first)
  const allNotifications: CombinedNotification[] = [
    ...fcmNotifications,
    ...notifications,
  ].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Newest first
  });

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <Card className="border-0 floating-card overflow-hidden rounded-2xl sm:rounded-3xl">
        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="absolute -top-10 right-2 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
                  className="flex items-center gap-2 h-10 w-10  hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/15 text-primary glow-primary">
                      <Bell className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
                    Notifications
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-2">
                    Votre centre de notifications et mises à jour importantes.
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold">
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold section-title flex items-center gap-2">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          Toutes les notifications
        </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications()}
            disabled={isRefreshing}
          className="h-10 px-4 bg-primary/10 border-primary/30 text-foreground hover:bg-primary/15"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualisation...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
        <Card className="glass-panel rounded-2xl sm:rounded-3xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : allNotifications.length === 0 ? (
        <Card className="glass-panel rounded-2xl sm:rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Bell className="h-8 w-8 text-primary" />
          </div>
            <p className="text-foreground font-semibold">Aucune notification</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vous serez notifié dès qu'il y aura du nouveau
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Notifications List */}
          <div className="space-y-3 sm:space-y-4">
              {allNotifications.map((notification) => {
                const isFCM = 'is_fcm' in notification && notification.is_fcm;
                
                return (
                  <Card
                    key={notification.id}
                  className={`glass-panel transition-all duration-200 hover:shadow-lg border-primary/10 rounded-2xl sm:rounded-3xl overflow-hidden ${
                    !notification.is_read ? 'ring-1 ring-primary/30' : ''
                  } ${isFCM ? 'bg-gradient-to-r from-blue-500/5 to-transparent' : ''}`}
                  >
                  <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className={`flex items-center justify-center w-10 h-10  ${
                            isFCM ? 'bg-blue-500/15 text-blue-600' : 'bg-primary/15 text-primary'
                          }`}>
                            {isFCM ? (
                              <MessageSquare className="h-5 w-5" />
                            ) : (
                              <Bell className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                              </div>
                            {isFCM && (
                                <Badge className="bg-blue-500/10 text-blue-700 border border-blue-500/20 text-xs font-medium px-2 py-0.5 mb-2">
                                  Push
                              </Badge>
                            )}
                            </div>
                          </div>
                          
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {notification.content}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span>{formatDate(notification.created_at)}</span>
                            {'reference' in notification && notification.reference && (
                              <span className="font-mono">#{notification.reference}</span>
                            )}
                          </div>
                          </div>
                        </div>
                        
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          className="flex items-center gap-2 h-9 px-3 text-xs hover:bg-primary/10 flex-shrink-0"
                          >
                          <Check className="h-3 w-3" />
                          <span className="hidden sm:inline">Lu</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {(hasNext || hasPrevious) && (
            <div className="flex items-center justify-center gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => fetchNotifications(page - 1)}
                  disabled={!hasPrevious || isLoading}
                className="h-10 px-4 border-primary/30 bg-primary/5 hover:bg-primary/10"
                >
                  Précédent
                </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 ">
                <span className="text-sm font-semibold text-primary">
                  Page {page}
                </span>
              </div>
                <Button
                  variant="outline"
                  onClick={() => fetchNotifications(page + 1)}
                  disabled={!hasNext || isLoading}
                className="h-10 px-4 border-primary/30 bg-primary/5 hover:bg-primary/10"
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
