
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getDashboardStats, getRecentInvoices, getRecentTransactions, formatCurrency } from '../services/dataService';
import { DashboardStats, Invoice, Transaction } from '../types';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Mock chart data
  const chartData = [
    { name: 'يناير', دخل: 400000, مصروف: 240000 },
    { name: 'فبراير', دخل: 300000, مصروف: 139800 },
    { name: 'مارس', دخل: 200000, مصروف: 980000 },
    { name: 'أبريل', دخل: 278000, مصروف: 390800 },
    { name: 'مايو', دخل: 189000, مصروف: 480000 },
    { name: 'يونيو', دخل: 239000, مصروف: 380000 },
  ];

  useEffect(() => {
    getDashboardStats().then(setStats);
    getRecentInvoices().then(setInvoices);
  }, []);

  if (!stats) return <div className="flex justify-center p-10"><span className="loading-spinner">جاري التحميل...</span></div>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-default">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">إجمالي الإيرادات</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(stats.totalRevenue)}</h3>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
            <TrendingUp className="text-green-600 dark:text-green-400 w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-default">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">إجمالي المصروفات</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(stats.totalExpenses)}</h3>
          </div>
          {/* Changed to Blue for Expenses */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <TrendingDown className="text-blue-600 dark:text-blue-400 w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-default">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">صافي الربح</p>
            {/* Red only if negative (loss) */}
            <h3 className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netProfit)}
            </h3>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full">
            <Wallet className="text-purple-600 dark:text-purple-400 w-6 h-6" />
          </div>
        </div>

        {/* Active Projects - Clickable */}
        <div 
          onClick={() => onNavigate('projects')}
          className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 group-hover:text-primary-600 transition-colors">المشاريع النشطة</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.activeProjects}</h3>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full group-hover:bg-orange-100 transition-colors">
            <Briefcase className="text-orange-600 dark:text-orange-400 w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Chart */}
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">التدفق النقدي (آخر 6 أشهر)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  {/* Expense Gradient = Blue */}
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ direction: 'rtl', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  labelStyle={{ color: '#374151' }}
                />
                <Area type="monotone" dataKey="دخل" stroke="#16a34a" fillOpacity={1} fill="url(#colorIncome)" name="الدخل" />
                {/* Expense Line = Blue */}
                <Area type="monotone" dataKey="مصروف" stroke="#3b82f6" fillOpacity={1} fill="url(#colorExpense)" name="المصروف" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status or Alerts */}
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            تنبيهات وإشعارات
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 rounded-md">
              <div className="flex justify-between">
                <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">فاتورة متأخرة</h4>
                <span className="text-xs text-red-600 dark:text-red-400">منذ يومين</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">مشروع السليمانية - دفعة المورد (الحديد)</p>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-r-4 border-yellow-500 rounded-md">
              <div className="flex justify-between">
                <h4 className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">ميزانية منخفضة</h4>
                <span className="text-xs text-yellow-600 dark:text-yellow-400">اليوم</span>
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">مشروع المجمع السكني يقترب من الحد الأقصى للمصاريف النثرية</p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 rounded-md">
              <div className="flex justify-between">
                <h4 className="font-bold text-blue-700 dark:text-blue-400 text-sm">اعتماد مطلوب</h4>
                <span className="text-xs text-blue-600 dark:text-blue-400">منذ 3 ساعات</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">سند صرف رواتب شهر مايو بانتظار الموافقة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">آخر الفواتير المسجلة</h3>
          <button 
            onClick={() => onNavigate('invoices')}
            className="text-sm text-primary-600 font-medium hover:text-primary-700 hover:underline"
          >
            عرض الكل
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الفاتورة</th>
                <th className="px-6 py-4 font-medium">المشروع</th>
                <th className="px-6 py-4 font-medium">التصنيف</th>
                <th className="px-6 py-4 font-medium">المبلغ</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inv.projectId}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${inv.type === 'مبيعات' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {inv.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">{formatCurrency(inv.amount)}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {inv.status === 'Paid' ? 'مدفوع' : inv.status === 'Overdue' ? 'متأخر' : 'معلق'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
