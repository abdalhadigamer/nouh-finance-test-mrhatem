
import React, { useState } from 'react';
import { Save, Bell, Lock, Globe, Shield, Users, Check, X } from 'lucide-react';
import { RolePermissions, UserRole, SystemModule, User } from '../types';
import { logActivity } from '../services/auditService';

interface SettingsProps {
  permissions?: RolePermissions[];
  onUpdatePermissions?: (permissions: RolePermissions[]) => void;
  currentUser?: User;
}

const Settings: React.FC<SettingsProps> = ({ permissions = [], onUpdatePermissions, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'permissions'>('general');
  const [localPermissions, setLocalPermissions] = useState<RolePermissions[]>(permissions);

  const togglePermission = (role: UserRole, module: SystemModule) => {
    setLocalPermissions(prev => prev.map(p => {
      if (p.role === role) {
        const canView = p.canView.includes(module) 
          ? p.canView.filter(m => m !== module) 
          : [...p.canView, module];
        return { ...p, canView };
      }
      return p;
    }));
  };

  const handleSavePermissions = () => {
    if (onUpdatePermissions) {
      onUpdatePermissions(localPermissions);
      if (currentUser) {
          logActivity(currentUser, 'UPDATE', 'Settings', 'تحديث صلاحيات الأدوار والمستخدمين');
      }
      alert('تم تحديث الصلاحيات بنجاح');
    }
  };

  const modules: { id: SystemModule; label: string }[] = [
    { id: 'dashboard', label: 'لوحة التحكم' },
    { id: 'financial_stats', label: 'الإحصائيات المالية (الأرباح/الإيرادات)' },
    { id: 'projects', label: 'المشاريع' },
    { id: 'clients', label: 'العملاء' },
    { id: 'company_expenses', label: 'مصاريف الشركة' },
    { id: 'profit_loss', label: 'الأرباح والخسائر' },
    { id: 'investors', label: 'المستثمرين' },
    { id: 'trusts', label: 'الأمانات' },
    { id: 'invoices', label: 'الفواتير' },
    { id: 'transactions', label: 'الحركات المالية' },
    { id: 'reports', label: 'التقارير' },
    { id: 'hr', label: 'الموارد البشرية' },
    { id: 'files', label: 'الأرشيف' },
    { id: 'settings', label: 'الإعدادات' },
  ];

  const configurableRoles = [UserRole.FINANCE_MANAGER, UserRole.ACCOUNTANT];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الإعدادات</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">تخصيص النظام، الصلاحيات، وتفضيلات المستخدم</p>
        </div>
        <div className="flex bg-white dark:bg-dark-900 rounded-lg p-1 border border-gray-200 dark:border-dark-700">
           <button 
             onClick={() => setActiveTab('general')} 
             className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'general' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
           >
             عام
           </button>
           <button 
             onClick={() => setActiveTab('permissions')} 
             className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'permissions' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
           >
             الصلاحيات والمستخدمين
           </button>
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-dark-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Globe size={20} className="text-primary-600" />
                إعدادات الشركة
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الشركة</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" defaultValue="بناء للحلول الهندسية" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني الرسمي</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" defaultValue="info@binaa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" defaultValue="+966 55 555 5555" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" defaultValue="الرياض، المملكة العربية السعودية" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-dark-800">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Bell size={20} className="text-orange-500" />
                  الإشعارات والتنبيهات
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">تنبيهات الفواتير المتأخرة</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">تنبيهات تجاوز الميزانية</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-dark-800">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Lock size={20} className="text-blue-500" />
                  الأمان وكلمة المرور
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الحالية</label>
                  <input type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الجديدة</label>
                  <input type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" placeholder="••••••••" />
                </div>
                <button className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">تفعيل المصادقة الثنائية (2FA)</button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-primary-500/30 transition-all">
              <Save size={20} />
              حفظ التغييرات
            </button>
          </div>
        </div>
      )}

      {/* PERMISSIONS TAB */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-dark-800 bg-blue-50/50 dark:bg-blue-900/10">
                 <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Shield size={20} />
                    مصفوفة الصلاحيات (Roles & Permissions)
                 </h2>
                 <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">تحكم دقيق في ما يمكن للمدير المالي والمحاسب رؤيته والوصول إليه.</p>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead>
                       <tr className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700">
                          <th className="px-6 py-4 font-medium w-1/3">الوحدة / القسم</th>
                          {configurableRoles.map(role => (
                             <th key={role} className="px-6 py-4 font-bold text-center border-r border-gray-200 dark:border-dark-700">
                                <div className="flex flex-col items-center gap-1">
                                   <Users size={18} className="text-gray-400" />
                                   {role}
                                </div>
                             </th>
                          ))}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                       {modules.map(module => (
                          <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                             <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">
                                {module.label}
                                {module.id === 'financial_stats' && (
                                   <p className="text-xs text-gray-400 mt-1 font-normal">عرض الأرقام الحساسة في لوحة التحكم (مثل الأرباح)</p>
                                )}
                             </td>
                             {configurableRoles.map(role => {
                                const rolePerms = localPermissions.find(p => p.role === role);
                                const hasAccess = rolePerms?.canView.includes(module.id);
                                
                                return (
                                   <td key={role} className="px-6 py-4 text-center border-r border-gray-100 dark:border-dark-700">
                                      <button 
                                        onClick={() => togglePermission(role, module.id)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${hasAccess ? 'bg-green-500' : 'bg-gray-300 dark:bg-dark-600'}`}
                                      >
                                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${hasAccess ? 'translate-x-0' : '-translate-x-6'}`}></div>
                                      </button>
                                   </td>
                                );
                             })}
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="flex justify-end pt-4">
            <button 
              onClick={handleSavePermissions}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-green-500/30 transition-all"
            >
              <Save size={20} />
              حفظ تحديثات الصلاحيات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
