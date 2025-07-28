import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, X, MessageSquare, Megaphone, Clock, Check } from 'lucide-react';

const NotificationSystem = ({ 
  newMessages = [],
  newAnnouncements = [],
  onNotificationClick,
  onClearAll
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Combine all notifications
  useEffect(() => {
    const allNotifications = [
      ...newMessages.map(msg => ({
        id: `msg_${msg.id}`,
        type: 'message',
        title: 'New Message',
        message: `${msg.senderName}: ${msg.content}`,
        timestamp: msg.timestamp,
        read: false,
        data: msg
      })),
      ...newAnnouncements.map(ann => ({
        id: `ann_${ann.id}`,
        type: 'announcement',
        title: 'New Announcement',
        message: `${ann.title} - ${ann.priority} priority`,
        timestamp: ann.date,
        read: false,
        data: ann
      }))
    ];

    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter(n => !n.read).length);
  }, [newMessages, newAnnouncements]);

  // Browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Send browser notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (!latestNotification.read && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(latestNotification.title, {
          body: latestNotification.message,
          icon: '/favicon.ico',
          tag: latestNotification.id
        });
      }
    }
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    // Callback for handling the notification click
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    setShowPanel(false);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    if (onClearAll) {
      onClearAll();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'message':
        return 'border-l-blue-500 bg-blue-50';
      case 'announcement':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {showPanel && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden shadow-xl z-50 border-0">
          <div className="p-4 border-b border-gray-200 bg-white/90">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {unreadCount} unread
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPanel(false)}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      getNotificationColor(notification.type)
                    } ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="w-full text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default NotificationSystem;