
import React from 'react';
import { Save, Bell, Lock, Globe } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الإعدادات العامة</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">تخصيص النظام وتفضيلات المستخدم</p>
      </div>

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
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">إشعارات البريد الإلكتروني</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
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
  );
};

export default Settings;
