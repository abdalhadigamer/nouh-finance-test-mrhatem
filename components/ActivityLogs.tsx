
import React, { useState, useEffect, useMemo } from 'react';
import { ActivityLog, UserRole } from '../types';
import { getLogs } from '../services/auditService';
import { Search, User, Calendar, Tag, Activity, History } from 'lucide-react';

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    getLogs().then(setLogs);
  }, []);

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || log.userRole === filterRole;
      const matchesAction = filterAction === 'all' || log.action === filterAction;

      return matchesSearch && matchesRole && matchesAction;
    });
  }, [logs, searchTerm, filterRole, filterAction]);

  // Group by Date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, ActivityLog[]> = {};
    filteredLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toLocaleDateString('ar-SA', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'APPROVE': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'LOGIN': return 'bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionLabel = (action: string) => {
      const map: Record<string, string> = {
          'CREATE': 'إضافة',
          'UPDATE': 'تعديل',
          'DELETE': 'حذف',
          'APPROVE': 'اعتماد',
          'REJECT': 'رفض',
          'LOGIN': 'دخول النظام'
      };
      return map[action] || action;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Activity className="text-primary-600" />
            سجل العمليات والنظام
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">تتبع كافة الإجراءات والعمليات التي تمت على النظام ومن قام بها.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="بحث في السجل (اسم المستخدم، نوع العملية، الوصف)..." 
              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         
         <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
             <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 min-w-fit">
                 <User size={16} className="text-gray-500" />
                 <select 
                    className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                 >
                     <option value="all">كل الأدوار</option>
                     <option value={UserRole.GENERAL_MANAGER}>المدير العام</option>
                     <option value={UserRole.FINANCE_MANAGER}>المدير المالي</option>
                     <option value={UserRole.ACCOUNTANT}>المحاسب</option>
                 </select>
             </div>

             <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 min-w-fit">
                 <Tag size={16} className="text-gray-500" />
                 <select 
                    className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                 >
                     <option value="all">كل العمليات</option>
                     <option value="CREATE">إضافة</option>
                     <option value="UPDATE">تعديل</option>
                     <option value="DELETE">حذف</option>
                     <option value="APPROVE">اعتماد</option>
                     <option value="LOGIN">دخول</option>
                 </select>
             </div>
         </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:mr-6 md:before:mr-[8.5rem] before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent dark:before:from-dark-700 dark:before:via-dark-800">
          {(Object.entries(groupedLogs) as [string, ActivityLog[]][]).map(([date, dayLogs]) => (
              <div key={date} className="relative">
                  <div className="sticky top-20 z-10 mb-4 mr-10 md:mr-44">
                      <span className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 px-3 py-1 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 shadow-sm flex items-center gap-2 w-fit">
                          <Calendar size={12} /> {date}
                      </span>
                  </div>

                  <div className="space-y-4">
                      {dayLogs.map(log => (
                          <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                              {/* Time Indicator (Desktop) */}
                              <div className="flex items-center absolute right-0 md:static md:w-32 justify-end md:pl-8">
                                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                                      {new Date(log.timestamp).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                              </div>
                              
                              {/* Connector Dot */}
                              <div className="absolute right-6 md:right-32 w-4 h-4 rounded-full border-2 border-white dark:border-dark-900 bg-gray-300 dark:bg-dark-600 group-hover:bg-primary-500 group-hover:scale-125 transition-all z-10 shadow-sm"></div>

                              {/* Content Card */}
                              <div className="mr-12 md:mr-0 flex-1 bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm hover:shadow-md transition-shadow group-hover:border-primary-200 dark:group-hover:border-primary-900/50">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getActionColor(log.action)}`}>
                                              {getActionLabel(log.action)}
                                          </span>
                                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-800 px-2 py-0.5 rounded">
                                              {log.entity}
                                          </span>
                                      </div>
                                      <div className="text-left">
                                          <p className="text-xs font-bold text-gray-800 dark:text-white">{log.userName}</p>
                                          <p className="text-[10px] text-gray-400">{log.userRole}</p>
                                      </div>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                                      {log.description}
                                  </p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
          
          {Object.keys(groupedLogs).length === 0 && (
              <div className="text-center py-20 mr-0">
                  <div className="bg-gray-50 dark:bg-dark-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-dark-600">
                      <History size={32} />
                  </div>
                  <p className="text-gray-400">لا توجد سجلات مطابقة للبحث</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default ActivityLogs;
