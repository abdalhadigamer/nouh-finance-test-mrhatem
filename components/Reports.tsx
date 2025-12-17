
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, TooltipProps
} from 'recharts';
import { formatCurrency } from '../services/dataService';
import { 
  Download, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Building2, 
  HardHat, 
  CalendarDays, 
  Clock, 
  Wallet, 
  AlertTriangle, 
  Shield, 
  Users, 
  CheckCircle,
  Coins
} from 'lucide-react';
import { TransactionType, Project, Transaction, Employee, Trustee, TrustTransaction, ContractType } from '../types';

interface ReportsProps {
    selectedYear?: number;
    projects: Project[];
    transactions: Transaction[];
    employees: Employee[];
    trustees: Trustee[];
    trustTransactions: TrustTransaction[];
}

// Custom Tooltip for Charts
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
              {entry.name.includes('%') ? entry.value : formatCurrency(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reports: React.FC<ReportsProps> = ({ selectedYear, projects, transactions, employees, trustees, trustTransactions }) => {
  const currentYear = selectedYear || new Date().getFullYear();
  
  // View Mode State
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'annual'>('annual');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split('T')[0]);

  // --- 1. Filter Transactions based on Report Type (For Charts & General Stats) ---
  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const tDate = new Date(t.date);
          
          if (reportType === 'annual') {
              return tDate.getFullYear() === currentYear;
          } else if (reportType === 'monthly') {
              return tDate.getFullYear() === currentYear && tDate.getMonth() === selectedMonth;
          } else {
              // Daily
              return t.date === selectedDay;
          }
      });
  }, [currentYear, reportType, selectedMonth, selectedDay, transactions]);

  // --- DAILY REPORT SPECIFIC CALCULATIONS ---
  const dailyReportData = useMemo(() => {
      // 1. Project Funds (Balances & Alerts) - DYNAMIC CALCULATION
      const projectsFunds = projects
        .filter(p => p.workshopThreshold !== undefined) // Projects that track workshop balance
        .map(p => {
            // Calculate dynamic balance from transactions to ensure accuracy
            const pTxns = transactions.filter(t => t.projectId === p.id);
            const totalReceived = pTxns.filter(t => t.type === TransactionType.RECEIPT).reduce((s, t) => s + t.amount, 0);
            const totalExpenses = pTxns.filter(t => t.type === TransactionType.PAYMENT).reduce((s, t) => s + t.amount, 0);
            
            let companyShare = 0;
            if (p.contractType !== ContractType.LUMP_SUM) {
                companyShare = (totalExpenses * (p.companyPercentage || 0)) / 100;
            }
            
            const dynamicBalance = totalReceived - totalExpenses - companyShare;

            return {
                id: p.id,
                name: p.name,
                balance: dynamicBalance,
                threshold: p.workshopThreshold || 0,
                isLow: dynamicBalance <= (p.workshopThreshold || 0)
            };
        });
      const totalProjectFunds = projectsFunds.reduce((sum, p) => sum + p.balance, 0);

      // 2. Trusts (Amanat)
      const trustsData = trustees.map(t => {
          const txns = trustTransactions.filter(x => x.trusteeId === t.id);
          const deposits = txns.filter(x => x.type === 'Deposit').reduce((sum, x) => sum + x.amount, 0);
          const withdrawals = txns.filter(x => x.type === 'Withdrawal').reduce((sum, x) => sum + x.amount, 0);
          return { name: t.name, balance: deposits - withdrawals };
      }).filter(t => t.balance !== 0); 
      
      const totalTrustsCashHeld = trustsData.filter(t => t.balance > 0).reduce((sum, t) => sum + t.balance, 0);
      const netTrustsBalance = trustsData.reduce((sum, t) => sum + t.balance, 0);

      // 3. Employee Petty Cash
      const employeeCustody = employees
        .filter(e => e.pettyCashBalance && e.pettyCashBalance > 0)
        .map(e => ({ name: e.name, balance: e.pettyCashBalance || 0 }));
      const totalCustody = employeeCustody.reduce((sum, e) => sum + e.balance, 0);

      // 4. Pending Expenses
      const pendingTxns = transactions.filter(t => t.status === 'Pending_Settlement' && t.type === TransactionType.PAYMENT);
      const pendingByProjectMap = new Map<string, number>();
      pendingTxns.forEach(t => {
          const pName = projects.find(p => p.id === t.projectId)?.name || 'مصاريف عامة';
          const current = pendingByProjectMap.get(pName) || 0;
          pendingByProjectMap.set(pName, current + t.amount);
      });
      const pendingExpensesList = Array.from(pendingByProjectMap.entries()).map(([name, amount]) => ({ name, amount }));
      const totalPendingExpenses = pendingTxns.reduce((sum, t) => sum + t.amount, 0);

      // 5. Main Treasury (Calculated dynamically)
      // Main Treasury = Total Income (Receipts) - Total Paid (Payments) - Funds currently held in projects/custody
      const totalIncomeHistory = transactions.filter(t => t.type === TransactionType.RECEIPT && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenseHistory = transactions.filter(t => t.type === TransactionType.PAYMENT && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
      
      const simulatedMainTreasury = Math.max(0, (totalIncomeHistory - totalExpenseHistory) - totalProjectFunds - totalCustody); 

      // Total Actual Cash On Hand = Main Treasury + Project Funds + Employee Custody + Trust Funds (Positive)
      // Note: Trust funds are a liability, but they are physically cash currently held.
      const totalCashOnHand = simulatedMainTreasury + totalProjectFunds + totalCustody + totalTrustsCashHeld;

      return {
          totalCashOnHand,
          mainTreasury: simulatedMainTreasury,
          projectsFunds,
          totalProjectFunds,
          trusts: trustsData,
          netTrustsBalance,
          employeeCustody,
          totalCustody,
          pendingExpensesList,
          totalPendingExpenses
      };
  }, [projects, transactions, employees, trustees, trustTransactions]);

  // --- 2. Calculate Chart Data ---
  const chartData = useMemo(() => {
      const data = [];
      
      if (reportType === 'annual') {
          const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          for (let i = 0; i < 12; i++) {
              const monthPrefix = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
              const monthTxns = transactions.filter(t => t.date.startsWith(monthPrefix));
              const income = monthTxns.filter(t => t.type === TransactionType.RECEIPT).reduce((sum, t) => sum + t.amount, 0);
              const expense = monthTxns.filter(t => t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
              data.push({
                  name: months[i],
                  إيرادات: income,
                  مصروفات: expense,
                  ربح: income - expense
              });
          }
      } else if (reportType === 'monthly') {
          const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
          for (let i = 1; i <= daysInMonth; i++) {
              const dayStr = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
              const dayTxns = transactions.filter(t => t.date === dayStr);
              const income = dayTxns.filter(t => t.type === TransactionType.RECEIPT).reduce((sum, t) => sum + t.amount, 0);
              const expense = dayTxns.filter(t => t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
              data.push({
                  name: i.toString(),
                  إيرادات: income,
                  مصروفات: expense,
                  ربح: income - expense
              });
          }
      } 
      return data;
  }, [currentYear, reportType, selectedMonth, transactions]);

  // --- 3. Calculate Summaries ---
  const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.RECEIPT).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.PAYMENT).reduce((acc, curr) => acc + curr.amount, 0);
  
  const projectExpenses = filteredTransactions.filter(t => t.type === TransactionType.PAYMENT && t.projectId && t.projectId !== 'General' && t.projectId !== 'N/A').reduce((acc, curr) => acc + curr.amount, 0);
  const overheadExpenses = filteredTransactions.filter(t => t.type === TransactionType.PAYMENT && (!t.projectId || t.projectId === 'General' || t.projectId === 'N/A')).reduce((acc, curr) => acc + curr.amount, 0);

  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // --- 4. Expense Distribution ---
  const expenseCategoryData = useMemo(() => {
      const sourceTxns = filteredTransactions.filter(t => t.type === TransactionType.PAYMENT);

      const materials = sourceTxns.filter(t => t.description.includes('حديد') || t.description.includes('مواد') || t.description.includes('شراء') || t.description.includes('قرطاسية')).reduce((acc, t) => acc + t.amount, 0);
      const salaries = sourceTxns.filter(t => t.description.includes('راتب') || t.recipientType === 'Staff' || t.recipientType === 'Worker').reduce((acc, t) => acc + t.amount, 0);
      const rentAndUtilities = sourceTxns.filter(t => t.description.includes('إيجار') || t.description.includes('كهرباء') || t.description.includes('انترنت')).reduce((acc, t) => acc + t.amount, 0);
      const other = sourceTxns.reduce((acc, t) => acc + t.amount, 0) - materials - salaries - rentAndUtilities;

      return [
        { name: 'مواد ومشتريات', value: materials },
        { name: 'رواتب وأجور', value: salaries },
        { name: 'إيجار وخدمات', value: rentAndUtilities },
        { name: 'مصاريف أخرى', value: Math.max(0, other) },
      ].filter(i => i.value > 0);
  }, [filteredTransactions]);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  // --- 5. Project Performance ---
  const projectPerformance = projects.map(p => ({
    name: p.name,
    budget: p.budget,
    profit: p.revenue - p.expenses,
    margin: p.revenue > 0 ? ((p.revenue - p.expenses) / p.revenue) * 100 : 0
  })).sort((a, b) => b.profit - a.profit);

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">التقارير المالية</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
              {reportType === 'annual' && `التقرير السنوي الشامل لعام ${currentYear}`}
              {reportType === 'monthly' && `التقرير الشهري - ${monthNames[selectedMonth]} ${currentYear}`}
              {reportType === 'daily' && `تقرير الجرد والسيولة اليومي`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 bg-white dark:bg-dark-900 p-2 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm">
           {/* Report Type Tabs */}
           <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-lg">
               <button 
                 onClick={() => setReportType('daily')}
                 className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${reportType === 'daily' ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
               >
                   يومي
               </button>
               <button 
                 onClick={() => setReportType('monthly')}
                 className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${reportType === 'monthly' ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
               >
                   شهري
               </button>
               <button 
                 onClick={() => setReportType('annual')}
                 className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${reportType === 'annual' ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
               >
                   سنوي
               </button>
           </div>

           {/* Dynamic Controls based on Report Type */}
           <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-3 mr-1">
               
               {/* Daily Control */}
               {reportType === 'daily' && (
                   <div className="flex items-center gap-2 px-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                       <Clock size={16} className="text-primary-500" />
                       <span>الوضع الحالي (مباشر)</span>
                   </div>
               )}

               {/* Monthly Control */}
               {reportType === 'monthly' && (
                   <select 
                     className="bg-transparent border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(Number(e.target.value))}
                   >
                       {monthNames.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                   </select>
               )}

               {/* Year Display (Always Visible/Context) */}
               {reportType !== 'daily' && (
                   <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 px-2 text-sm font-mono font-bold bg-gray-50 dark:bg-dark-800 rounded-lg py-1.5">
                       <CalendarDays size={14} />
                       {currentYear}
                   </div>
               )}
           </div>

           <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-sm text-sm font-bold transition-colors">
             <Download size={16} />
             <span>تصدير</span>
           </button>
        </div>
      </div>

      {/* ---------------- DAILY REPORT VIEW (DETAILED CASH FLOW) ---------------- */}
      {reportType === 'daily' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Daily Report Content (Projects Funds, Trusts, etc.) */}
              {/* 1. TOTAL CASH (Top Hero Card) */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                              <Wallet size={40} className="text-white" />
                          </div>
                          <div>
                              <h2 className="text-sm font-bold text-emerald-100 mb-1 opacity-90">كاش الشركة (النقد المتوفر حالياً)</h2>
                              <p className="text-5xl font-extrabold tracking-tight" dir="ltr">{formatCurrency(dailyReportData.totalCashOnHand)}</p>
                              <p className="text-xs text-emerald-200 mt-2 font-medium">يشمل الخزينة الرئيسية + صناديق المشاريع + العهد + الأمانات</p>
                          </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right">
                          <div className="bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                              <span className="text-xs text-emerald-200 block">الخزينة الرئيسية</span>
                              <span className="font-bold text-lg">{formatCurrency(dailyReportData.mainTreasury)}</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* 2. Projects Funds (Left Column) */}
                  <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                          <h3 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                              <HardHat size={20} />
                              صناديق المشاريع (الورشة)
                          </h3>
                          <span className="text-sm font-extrabold text-blue-700 dark:text-blue-400">{formatCurrency(dailyReportData.totalProjectFunds)}</span>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                          <table className="w-full text-sm text-right">
                              <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                                  <tr>
                                      <th className="px-5 py-3">المشروع</th>
                                      <th className="px-5 py-3">الرصيد الحالي</th>
                                      <th className="px-5 py-3">الحالة</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                                  {dailyReportData.projectsFunds.length > 0 ? dailyReportData.projectsFunds.map(p => (
                                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                          <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{p.name}</td>
                                          <td className="px-5 py-3 font-bold text-gray-700 dark:text-gray-300">{formatCurrency(p.balance)}</td>
                                          <td className="px-5 py-3">
                                              {p.isLow ? (
                                                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full w-fit">
                                                      <AlertTriangle size={12} /> اطلب دفعة
                                                  </span>
                                              ) : (
                                                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full w-fit">
                                                      <CheckCircle size={12} /> متوفر
                                                  </span>
                                              )}
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={3} className="text-center py-6 text-gray-400">لا توجد صناديق مشاريع نشطة</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* 3. Trusts & Deposits */}
                  <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-teal-50/50 dark:bg-teal-900/10">
                          <h3 className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-2">
                              <Shield size={20} />
                              الأمانات والودائع
                          </h3>
                          <span className="text-sm font-extrabold text-teal-700 dark:text-teal-400">{formatCurrency(dailyReportData.netTrustsBalance)}</span>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                          <table className="w-full text-sm text-right">
                              <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                                  <tr>
                                      <th className="px-5 py-3">الاسم</th>
                                      <th className="px-5 py-3">رصيد الأمانة</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                                  {dailyReportData.trusts.length > 0 ? dailyReportData.trusts.map((t, i) => (
                                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                          <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{t.name}</td>
                                          <td className={`px-5 py-3 font-bold ${t.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'}`}>
                                              <span dir="ltr">{formatCurrency(t.balance)}</span>
                                              {t.balance < 0 && <span className="mr-2 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">تم كسر الصندوق (عجز)</span>}
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={2} className="text-center py-6 text-gray-400">لا توجد أمانات مسجلة</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      ) : (
      // ---------------- ANNUAL/MONTHLY VIEW ----------------
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">صافي الربح</h4>
                <div className="flex items-end gap-3">
                <span className={`text-3xl font-bold ${netProfit >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-600'}`}>{formatCurrency(netProfit)}</span>
                <span className={`text-sm font-bold flex items-center mb-1 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <TrendingUp size={14} /> {margin.toFixed(1)}%
                </span>
                </div>
            </div>
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">إجمالي الإيرادات</h4>
                <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</span>
                </div>
            </div>
            
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium flex items-center gap-1"><HardHat size={14} /> مصاريف المشاريع</h4>
                <div className="flex items-end gap-3">
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(projectExpenses)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">تكاليف مباشرة</p>
            </div>
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium flex items-center gap-1"><Building2 size={14} /> مصاريف الشركة</h4>
                <div className="flex items-end gap-3">
                <span className="text-2xl font-bold text-orange-600">{formatCurrency(overheadExpenses)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">تكاليف تشغيلية</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-primary-600" size={20} />
                    {reportType === 'annual' ? 'التحليل الشهري' : 'التحليل اليومي للشهر'}
                </h3>
                <div className="h-80 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                        <XAxis dataKey="name" tick={{fill: '#9ca3af', fontSize: 10}} interval={reportType === 'monthly' ? 2 : 0} />
                        <YAxis tick={{fill: '#9ca3af', fontSize: 10}} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                        <Bar dataKey="إيرادات" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="مصروفات" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <PieChartIcon className="text-primary-600" size={20} />
                    توزيع المصروفات {reportType === 'monthly' ? 'هذا الشهر' : 'السنوية'}
                </h3>
            </div>
            
            <div className="h-80 w-full flex items-center justify-center flex-1" dir="ltr">
                {expenseCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {expenseCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-gray-400">لا توجد مصاريف مسجلة في هذه الفترة</div>
                )}
            </div>
            </div>
        </div>
      </>
      )}
    </div>
  );
};

export default Reports;
