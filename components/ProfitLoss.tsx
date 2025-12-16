
import React, { useMemo, useState } from 'react';
import { TransactionType, ProjectType, ProjectStatus, Transaction, Project } from '../types';
import { formatCurrency } from '../services/dataService';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Activity,
  Briefcase,
  Building2,
  DollarSign,
  CheckCircle,
  Clock,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  TooltipProps,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ProfitLossProps {
  selectedYear?: number;
  transactions: Transaction[];
  projects: Project[];
}

// Custom Tooltip for Dark Mode
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-800 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-dark-700 text-right">
        <p className="font-bold text-gray-800 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
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

const ProfitLoss: React.FC<ProfitLossProps> = ({ selectedYear, transactions, projects }) => {
  const currentYear = selectedYear || new Date().getFullYear();
  const [period, setPeriod] = useState<'Annual' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('Annual');

  // 1. Filter Transactions based on Year and Period
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        const matchesYear = tDate.getFullYear() === currentYear;
        
        if (!matchesYear) return false;

        if (period === 'Annual') return true;
        const month = tDate.getMonth(); // 0-11
        if (period === 'Q1') return month >= 0 && month <= 2;
        if (period === 'Q2') return month >= 3 && month <= 5;
        if (period === 'Q3') return month >= 6 && month <= 8;
        if (period === 'Q4') return month >= 9 && month <= 11;
        
        return true;
    });
  }, [currentYear, period, transactions]);

  // --- LOGIC IMPLEMENTATION ---

  // A. Company Operating Expenses Analysis
  const opExAnalysis = useMemo(() => {
      const opExTxns = filteredTransactions.filter(t => 
          t.type === TransactionType.PAYMENT && 
          (!t.projectId || t.projectId === 'General' || t.projectId === 'N/A')
      );

      const totalOpEx = opExTxns.reduce((acc, t) => acc + t.amount, 0);

      // Define Categories based on keywords
      const categories: Record<string, number> = {
          'رواتب وأجور الموظفين': 0,
          'إيجار ومرافق': 0,
          'ضيافة ونظافة': 0,
          'صيانة وإصلاحات': 0,
          'تسويق وإعلانات': 0,
          'رسوم حكومية': 0,
          'نثريات ومصاريف أخرى': 0
      };

      opExTxns.forEach(t => {
          const desc = t.description.toLowerCase();
          if (desc.includes('راتب') || desc.includes('أجور') || desc.includes('سلفة') || desc.includes('مكافأة')) {
              categories['رواتب وأجور الموظفين'] += t.amount;
          } else if (desc.includes('إيجار') || desc.includes('كهرباء') || desc.includes('ماء') || desc.includes('نت') || desc.includes('اتصالات')) {
              categories['إيجار ومرافق'] += t.amount;
          } else if (desc.includes('ضيافة') || desc.includes('قهوة') || desc.includes('شاي') || desc.includes('تنظيف') || desc.includes('منظفات') || desc.includes('مناديل')) {
              categories['ضيافة ونظافة'] += t.amount;
          } else if (desc.includes('صيانة') || desc.includes('إصلاح') || desc.includes('سباكة مكتب') || desc.includes('تكييف')) {
              categories['صيانة وإصلاحات'] += t.amount;
          } else if (desc.includes('تسويق') || desc.includes('إعلان') || desc.includes('سوشيال')) {
              categories['تسويق وإعلانات'] += t.amount;
          } else if (desc.includes('رخصة') || desc.includes('سجل') || desc.includes('غرفة') || desc.includes('تجديد') || desc.includes('جوازات')) {
              categories['رسوم حكومية'] += t.amount;
          } else {
              categories['نثريات ومصاريف أخرى'] += t.amount;
          }
      });

      const breakdown = Object.entries(categories)
          .filter(([_, val]) => val > 0)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

      return { totalOpEx, breakdown };
  }, [filteredTransactions]);

  const { totalOpEx: operatingExpenses, breakdown: expensesBreakdown } = opExAnalysis;

  // B. Detailed Project Financials
  const detailedProjects = useMemo(() => {
      const relevantProjectIds = Array.from(new Set(filteredTransactions.map(t => t.projectId).filter(id => id && id !== 'General' && id !== 'N/A')));
      
      const processed = relevantProjectIds.map(pid => {
          const project = projects.find(p => p.id === pid);
          if (!project) return null;

          const pTxns = filteredTransactions.filter(t => t.projectId === pid);
          const revenue = pTxns.filter(t => t.type === TransactionType.RECEIPT).reduce((sum, t) => sum + t.amount, 0);
          const expense = pTxns.filter(t => t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
          
          let profit = 0;
          if (project.type === ProjectType.DESIGN || project.type === ProjectType.SUPERVISION) {
              profit = revenue; 
          } else {
              profit = revenue - expense;
          }

          return {
              ...project,
              periodRevenue: revenue,
              periodExpense: expense,
              periodProfit: profit
          };
      }).filter(Boolean) as (Project & { periodRevenue: number, periodExpense: number, periodProfit: number })[];

      return processed;
  }, [filteredTransactions, projects]);

  const designProjects = detailedProjects.filter(p => p.type === ProjectType.DESIGN || p.type === ProjectType.SUPERVISION);
  const executionProjects = detailedProjects.filter(p => p.type !== ProjectType.DESIGN && p.type !== ProjectType.SUPERVISION);

  const totalDesignProfit = designProjects.reduce((acc, p) => acc + p.periodProfit, 0);
  const totalExecutionProfit = executionProjects.reduce((acc, p) => acc + p.periodProfit, 0);
  const totalProjectGrossProfit = totalDesignProfit + totalExecutionProfit;

  // C. Net Profit
  const netProfit = totalProjectGrossProfit - operatingExpenses;
  
  // D. Chart Data
  const chartData = useMemo(() => {
      const data = [];
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      
      for (let i = 0; i < 12; i++) {
          if (period === 'Q1' && i > 2) continue;
          if (period === 'Q2' && (i < 3 || i > 5)) continue;
          if (period === 'Q3' && (i < 6 || i > 8)) continue;
          if (period === 'Q4' && i < 9) continue;

          const monthIndex = i + 1;
          const monthPrefix = `${currentYear}-${String(monthIndex).padStart(2, '0')}`;
          const monthTxns = transactions.filter(t => t.date.startsWith(monthPrefix));
          
          // Projects Logic
          let mProjProfit = 0;
          const mProjects = Array.from(new Set(monthTxns.map(t => t.projectId).filter(id => id && id !== 'General' && id !== 'N/A')));
          
          mProjects.forEach(pid => {
              const project = projects.find(p => p.id === pid);
              const pTxns = monthTxns.filter(t => t.projectId === pid);
              const rev = pTxns.filter(t => t.type === TransactionType.RECEIPT).reduce((s, t) => s + t.amount, 0);
              const exp = pTxns.filter(t => t.type === TransactionType.PAYMENT).reduce((s, t) => s + t.amount, 0);
              
              if (project?.type === ProjectType.DESIGN || project?.type === ProjectType.SUPERVISION) {
                  mProjProfit += rev;
              } else {
                  mProjProfit += (rev - exp);
              }
          });

          const mOpEx = monthTxns
            .filter(t => t.type === TransactionType.PAYMENT && (!t.projectId || t.projectId === 'General' || t.projectId === 'N/A'))
            .reduce((s, t) => s + t.amount, 0);

          data.push({
              name: months[i],
              'أرباح المشاريع': Math.max(0, mProjProfit),
              'مصاريف الشركة': mOpEx,
              'صافي الدخل': mProjProfit - mOpEx
          });
      }
      return data;
  }, [currentYear, period, transactions, projects]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

  const getStatusBadge = (status: ProjectStatus) => {
      switch(status) {
          case ProjectStatus.DELIVERED: return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><CheckCircle size={10}/> منتهي</span>;
          case ProjectStatus.EXECUTION: return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Clock size={10}/> قيد التنفيذ</span>;
          case ProjectStatus.DESIGN: return <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Briefcase size={10}/> تصميم</span>;
          default: return <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{status}</span>;
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Activity className="text-green-600" />
            تقرير الأرباح والخسائر التفصيلي
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
              تحليل ربحية كل مشروع والمصاريف التشغيلية المفصلة للسنة {currentYear}
          </p>
        </div>
        <div className="flex gap-2">
           <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg p-1 flex">
              {['Annual', 'Q1', 'Q2', 'Q3', 'Q4'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p as any)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${period === p ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}
                  >
                      {p === 'Annual' ? 'سنوي' : p}
                  </button>
              ))}
           </div>
           <button 
             onClick={() => window.print()}
             className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
           >
             <Download size={18} />
             <span>طباعة التقرير</span>
           </button>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-2">إجمالي مجمل الربح من المشاريع</p>
              <h3 className="text-3xl font-extrabold text-green-600 dark:text-green-400">{formatCurrency(totalProjectGrossProfit)}</h3>
              <div className="mt-2 text-xs text-gray-500">
                  (تصميم: {formatCurrency(totalDesignProfit)} + تنفيذ: {formatCurrency(totalExecutionProfit)})
              </div>
          </div>

          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-2">مصاريف الشركة (OpEx)</p>
              <h3 className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">{formatCurrency(operatingExpenses)}</h3>
              <div className="mt-2 text-xs text-gray-500">
                  (رواتب، إيجارات، منظفات، صيانة، فواتير)
              </div>
          </div>

          <div className={`p-6 rounded-2xl shadow-lg text-white relative overflow-hidden ${netProfit >= 0 ? 'bg-gradient-to-br from-primary-700 to-primary-900' : 'bg-gradient-to-br from-red-700 to-red-900'}`}>
              <p className="text-white/80 text-sm font-bold mb-2">صافي الربح النهائي (Net Profit)</p>
              <h3 className="text-4xl font-extrabold mb-2">{formatCurrency(netProfit)}</h3>
              <div className="text-xs text-white/70 font-medium">
                  بعد خصم كافة مصاريف المشاريع والشركة
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Tables Section */}
          <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Design Projects Table */}
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-purple-50/50 dark:bg-purple-900/10">
                      <h3 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                          <Briefcase size={20} />
                          أولاً: أرباح مشاريع التصميم والإشراف
                      </h3>
                      <span className="text-sm font-extrabold text-purple-700 dark:text-purple-400">{formatCurrency(totalDesignProfit)}</span>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                          <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                              <tr>
                                  <th className="px-6 py-3">المشروع</th>
                                  <th className="px-6 py-3">الحالة</th>
                                  <th className="px-6 py-3">الإيراد (الربح)</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                              {designProjects.length > 0 ? designProjects.map(p => (
                                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                      <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">
                                          {p.name}
                                          <div className="text-[10px] text-gray-400">{p.clientName}</div>
                                      </td>
                                      <td className="px-6 py-3">{getStatusBadge(p.status)}</td>
                                      <td className="px-6 py-3 font-bold text-green-600 dark:text-green-400">{formatCurrency(p.periodProfit)}</td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan={3} className="text-center py-4 text-gray-400">لا توجد مشاريع تصميم في هذه الفترة</td></tr>
                              )}
                          </tbody>
                          <tfoot className="bg-gray-50 dark:bg-dark-800 font-bold">
                              <tr>
                                  <td colSpan={2} className="px-6 py-3 text-left">الإجمالي الفرعي</td>
                                  <td className="px-6 py-3 text-purple-700 dark:text-purple-400">{formatCurrency(totalDesignProfit)}</td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>
              </div>

              {/* 2. Execution Projects Table */}
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                      <h3 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                          <Building2 size={20} />
                          ثانياً: أرباح مشاريع التنفيذ والمقاولات
                      </h3>
                      <span className="text-sm font-extrabold text-blue-700 dark:text-blue-400">{formatCurrency(totalExecutionProfit)}</span>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                          <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                              <tr>
                                  <th className="px-6 py-3">المشروع</th>
                                  <th className="px-6 py-3">الحالة</th>
                                  <th className="px-6 py-3">الإيراد (مقبوض)</th>
                                  <th className="px-6 py-3">مصروف مباشر</th>
                                  <th className="px-6 py-3">صافي الربح</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                              {executionProjects.length > 0 ? executionProjects.map(p => (
                                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                      <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">
                                          {p.name}
                                          <div className="text-[10px] text-gray-400">{p.clientName}</div>
                                      </td>
                                      <td className="px-6 py-3">{getStatusBadge(p.status)}</td>
                                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{formatCurrency(p.periodRevenue)}</td>
                                      <td className="px-6 py-3 text-red-500 dark:text-red-400">({formatCurrency(p.periodExpense)})</td>
                                      <td className={`px-6 py-3 font-bold ${p.periodProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>
                                          {formatCurrency(p.periodProfit)}
                                      </td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan={5} className="text-center py-4 text-gray-400">لا توجد مشاريع تنفيذ في هذه الفترة</td></tr>
                              )}
                          </tbody>
                          <tfoot className="bg-gray-50 dark:bg-dark-800 font-bold">
                              <tr>
                                  <td colSpan={4} className="px-6 py-3 text-left">الإجمالي الفرعي</td>
                                  <td className="px-6 py-3 text-blue-700 dark:text-blue-400">{formatCurrency(totalExecutionProfit)}</td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>
              </div>

              {/* 3. Company Operating Expenses Detail Table */}
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-orange-50/50 dark:bg-orange-900/10">
                      <h3 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-2">
                          <TrendingDown size={20} />
                          ثالثاً: تفاصيل مصاريف الشركة (مصنفة)
                      </h3>
                      <span className="text-sm font-extrabold text-red-700 dark:text-red-400">({formatCurrency(operatingExpenses)})</span>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                          <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                              <tr>
                                  <th className="px-6 py-3">نوع المصروف</th>
                                  <th className="px-6 py-3">التفاصيل</th>
                                  <th className="px-6 py-3">القيمة الإجمالية</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                              {expensesBreakdown.length > 0 ? expensesBreakdown.map((item, index) => (
                                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                      <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">
                                          {item.name}
                                      </td>
                                      <td className="px-6 py-3 text-xs text-gray-500">
                                          شاملة حتى تاريخه
                                      </td>
                                      <td className="px-6 py-3 font-bold text-red-600 dark:text-red-400">
                                          {formatCurrency(item.value)}
                                      </td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan={3} className="text-center py-4 text-gray-400">لا توجد مصاريف مسجلة في هذه الفترة</td></tr>
                              )}
                          </tbody>
                          <tfoot className="bg-gray-50 dark:bg-dark-800 font-bold">
                              <tr>
                                  <td colSpan={2} className="px-6 py-3 text-left">إجمالي المصاريف التشغيلية</td>
                                  <td className="px-6 py-3 text-red-700 dark:text-red-400">{formatCurrency(operatingExpenses)}</td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>
              </div>

              {/* 4. Final Summary Table */}
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-100 dark:bg-dark-800">
                      <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <DollarSign size={20} />
                          ملخص قائمة الدخل النهائي
                      </h3>
                  </div>
                  <div className="p-0">
                      <div className="flex justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-800">
                          <span className="text-gray-600 dark:text-gray-400">إجمالي أرباح المشاريع (تصميم + تنفيذ)</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(totalProjectGrossProfit)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-800">
                          <span className="text-gray-600 dark:text-gray-400">يخصم: المصاريف التشغيلية للشركة</span>
                          <span className="font-bold text-red-600 dark:text-red-400">({formatCurrency(operatingExpenses)})</span>
                      </div>
                      <div className="flex justify-between px-6 py-5 bg-primary-50 dark:bg-primary-900/10">
                          <span className="font-extrabold text-lg text-primary-900 dark:text-primary-100">صافي الربح النهائي</span>
                          <span className={`font-extrabold text-xl ${netProfit >= 0 ? 'text-primary-700 dark:text-primary-300' : 'text-red-600'}`}>
                              {formatCurrency(netProfit)}
                          </span>
                      </div>
                  </div>
              </div>

          </div>

          {/* Visual Analysis (Sidebar) */}
          <div className="space-y-6">
              
              {/* Monthly Trend Chart */}
              <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-sm flex items-center gap-2">
                      <TrendingUp size={16} /> الأداء الشهري العام
                  </h3>
                  <div className="h-64 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                              <XAxis dataKey="name" tick={{fill: '#9ca3af', fontSize: 10}} interval={0} />
                              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                              <Legend wrapperStyle={{paddingTop: '20px'}} />
                              <Bar dataKey="أرباح المشاريع" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                              <Bar dataKey="مصاريف الشركة" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={30} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Expense Breakdown Pie Chart */}
              <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-sm flex items-center gap-2">
                      <PieChartIcon size={16} /> توزيع مصاريف الشركة
                  </h3>
                  <div className="h-64 w-full" dir="ltr">
                      {expensesBreakdown.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={expensesBreakdown}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={2}
                                      dataKey="value"
                                  >
                                      {expensesBreakdown.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}} />
                              </PieChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                              لا توجد بيانات للعرض
                          </div>
                      )}
                  </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  <strong>ملاحظة:</strong>
                  <br/>
                  * الأرقام أعلاه تشمل العمليات المسجلة حتى تاريخ اليوم ضمن السنة المالية المختارة.
                  <br/>
                  * "أرباح المشاريع" هي صافي ربح كل مشروع بعد خصم مصاريفه المباشرة.
                  <br/>
                  * "مصاريف الشركة" هي التكاليف العامة التي لا يمكن تحميلها لمشروع بعينه.
              </div>
          </div>
      </div>
    </div>
  );
};

export default ProfitLoss;
