
import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  TooltipProps
} from 'recharts';
import { formatCurrency } from '../services/dataService';
import { DashboardStats, Invoice, Project, Transaction, TransactionType, ProjectStatus } from '../types';

interface DashboardProps {
  onNavigate: (page: string) => void;
  selectedYear: number;
  projects: Project[];
  transactions: Transaction[];
  invoices: Invoice[];
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-dark-700 text-right">
        <p className="font-bold text-gray-800 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
            <span className="font-bold text-gray-800 dark:text-white" dir="ltr">
              {formatCurrency(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, selectedYear, projects, transactions, invoices }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  
  // Calculate stats based on year and live data
  useEffect(() => {
    // Filter transactions by year
    const relevantTransactions = transactions.filter(t => t.date.startsWith(selectedYear.toString()));
    
    // Revenue: Receipts
    const revenue = relevantTransactions.filter(t => t.type === TransactionType.RECEIPT).reduce((sum, t) => sum + t.amount, 0);
    // Expenses: Payments
    const expenses = relevantTransactions.filter(t => t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
    
    // Active Projects Count
    const activeProjectsCount = projects.filter(p => p.status === ProjectStatus.EXECUTION || p.status === ProjectStatus.DESIGN).length;

    // Update Stats
    setStats({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: revenue - expenses,
        activeProjects: activeProjectsCount,
        cashFlowStatus: (revenue - expenses) > 0 ? 'Positive' : 'Negative'
    });

    // Filter invoices by year
    setFilteredInvoices(invoices.filter(i => i.date.startsWith(selectedYear.toString())));

  }, [selectedYear, projects, transactions, invoices]);

  // Generate Chart Data dynamically based on selected year
  const chartData = useMemo(() => {
      const data = [];
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      
      for (let i = 0; i < 12; i++) {
          const monthIndex = i + 1;
          const monthPrefix = `${selectedYear}-${String(monthIndex).padStart(2, '0')}`;
          
          // Filter transactions for this specific month from LIVE data
          const monthTxns = transactions.filter(t => t.date.startsWith(monthPrefix));
          
          data.push({
              name: months[i],
              دخل: monthTxns.filter(t => t.type === TransactionType.RECEIPT).reduce((sum, t) => sum + t.amount, 0),
              مصروف: monthTxns.filter(t => t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0)
          });
      }
      return data;
  }, [selectedYear, transactions]);

  if (!stats) return <div className="flex justify-center p-10"><span className="loading-spinner text-primary-600">جاري التحميل...</span></div>;

  return (
    <div className="space-y-6">
      
      {/* Year Indicator Banner */}
      <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 p-3 rounded-xl flex justify-center items-center gap-2 text-primary-700 dark:text-primary-300 font-bold text-sm">
          <span>أنت تشاهد البيانات المالية لسنة:</span>
          <span className="bg-white dark:bg-dark-900 px-3 py-0.5 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 text-lg">{selectedYear}</span>
      </div>

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
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <TrendingDown className="text-blue-600 dark:text-blue-400 w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-default">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">صافي الربح</p>
            <h3 className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netProfit)}
            </h3>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full">
            <Wallet className="text-purple-600 dark:text-purple-400 w-6 h-6" />
          </div>
        </div>

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
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">التدفق النقدي ({selectedYear})</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="دخل" stroke="#16a34a" fillOpacity={1} fill="url(#colorIncome)" name="الدخل" />
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
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {/* Logic to show real alerts based on data can be added here. For now, showing empty state if no mock alerts are relevant to empty data */}
            {filteredInvoices.filter(i => i.status === 'Overdue').length > 0 ? (
                 filteredInvoices.filter(i => i.status === 'Overdue').map(inv => (
                    <div key={inv.id} className="p-4 bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 rounded-md">
                        <div className="flex justify-between">
                            <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">فاتورة متأخرة</h4>
                            <span className="text-xs text-red-600 dark:text-red-400">{inv.date}</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">فاتورة رقم {inv.invoiceNumber} - {inv.supplierName}</p>
                    </div>
                 ))
            ) : (
                <div className="text-center text-gray-400 py-10">
                    لا توجد تنبيهات نشطة حالياً
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">آخر الفواتير المسجلة ({selectedYear})</h3>
          <button 
            onClick={() => onNavigate('invoices')}
            className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 hover:underline"
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
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {projects.find(p => p.id === inv.projectId)?.name || inv.projectId}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>
                      {inv.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">{formatCurrency(inv.amount)}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${inv.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {inv.status === 'Paid' ? 'مدفوع' : inv.status === 'Overdue' ? 'متأخر' : 'معلق'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                  <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">لا توجد بيانات لهذه السنة</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
