
import React, { useState } from 'react';
import { MOCK_NOTIFICATIONS } from '../constants';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Check, Inbox, Zap, Info as InfoIcon } from 'lucide-react';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'info' | 'success'>('all');

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'urgent':
        return notifications.filter(n => ['error', 'warning'].includes(n.type));
      case 'success':
        return notifications.filter(n => n.type === 'success');
      case 'info':
        return notifications.filter(n => n.type === 'info');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const getIcon = (type: string) => {
    switch(type) {
      case 'error': return <XCircle size={20} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-orange-500" />;
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  // Counts for tabs
  const urgentCount = notifications.filter(n => ['error', 'warning'].includes(n.type) && !n.isRead).length;
  const allUnreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">مركز الإشعارات</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">عرض ومتابعة كافة التنبيهات والإشعارات</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 px-4 py-2 rounded-lg transition-colors"
        >
          <Check size={18} />
          تحديد الكل كمقروء
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-1">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'all' 
              ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900 shadow-md' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 dark:text-gray-400'
          }`}
        >
          <Inbox size={16} />
          الكل
          {allUnreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{allUnreadCount}</span>}
        </button>

        <button 
          onClick={() => setActiveTab('urgent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'urgent' 
              ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 dark:text-gray-400'
          }`}
        >
          <AlertTriangle size={16} />
          تنبيهات عاجلة
          {urgentCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{urgentCount}</span>}
        </button>

        <button 
          onClick={() => setActiveTab('success')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'success' 
              ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 dark:text-gray-400'
          }`}
        >
          <Zap size={16} />
          إنجازات
        </button>

        <button 
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'info' 
              ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 dark:text-gray-400'
          }`}
        >
          <InfoIcon size={16} />
          معلومات عامة
        </button>
      </div>

      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden min-h-[400px]">
        {filteredNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-5 border-b border-gray-100 dark:border-dark-800 flex gap-4 items-start hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-white dark:bg-dark-700 shadow-sm' : 'bg-gray-100 dark:bg-dark-800'}`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold text-gray-800 dark:text-gray-200 ${!notification.isRead ? 'text-black dark:text-white' : ''}`}>
                  {notification.title}
                </h3>
                <span className="text-xs text-gray-400">{notification.time}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
            </div>
            {!notification.isRead && (
              <button 
                onClick={() => markAsRead(notification.id)}
                className="self-center p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full"
                title="تحديد كمقروء"
              >
                <div className="w-2.5 h-2.5 bg-primary-600 rounded-full"></div>
              </button>
            )}
          </div>
        ))}
        
        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-full mb-3">
               <Bell size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p>لا توجد إشعارات في هذا القسم حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
