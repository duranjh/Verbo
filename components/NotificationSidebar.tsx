
import React, { useState } from 'react';
import { Notification } from '../types';
import { IconClose, IconBell, IconReply, IconLike, IconCheckAll, IconAlert } from './Icons';

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationSidebar: React.FC<NotificationSidebarProps> = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
        case 'REPLY': return <IconReply className="w-4 h-4 text-indigo-500" />;
        case 'LIKE': return <IconLike className="w-4 h-4 text-blue-500" />;
        case 'SYSTEM': return <IconAlert className="w-4 h-4 text-orange-500" />;
        default: return <IconBell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg text-slate-800">Notifications</h2>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {notifications.filter(n => !n.read).length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onMarkAllAsRead}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Mark all as read"
                    >
                        <IconCheckAll className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <IconClose className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex p-2 bg-slate-50 border-b border-slate-100 gap-1">
                <button 
                    onClick={() => setFilter('ALL')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === 'ALL' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setFilter('UNREAD')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === 'UNREAD' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Unread
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <IconBell className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-medium">No notifications found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filteredNotifications.map(notification => (
                            <div 
                                key={notification.id}
                                onClick={() => onMarkAsRead(notification.id)}
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${notification.read ? 'opacity-60 bg-slate-50/50' : 'bg-white'}`}
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.read ? 'bg-slate-100' : 'bg-indigo-50'}`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm leading-snug mb-1 ${notification.read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {formatDate(notification.timestamp)}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="flex-shrink-0 mt-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </>
  );
};
