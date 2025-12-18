
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '../services/dataService';
import { Project, Transaction, TransactionType, Employee, Trustee, TrustTransaction, ContractType } from '../types';
import { Calendar, Download, PieChart as PieChartIcon, TrendingUp, AlertTriangle } from 'lucide-react';

interface ReportsProps {
  selectedYear?: number;
  transactions: Transaction[];
  projects: Project[];
  employees: Employee[];
  trustees: Trustee[];
  trustTransactions: TrustTransaction[];
}

const Reports: React.FC<ReportsProps> = ({ 
    selectedYear, 
    transactions, 
    projects, 
    employees, 
    trustees, 
    trustTransactions 
}) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'annual'>('daily');
  const currentYear = selectedYear || new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);

  // --- 1. Filter Transactions based on Report Type (For Charts & General Stats) ---
  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const tDate = new Date(t.date);
          // CRITICAL FIX: Ensure reports are USD only
          const isUSD = t.currency !== 'SYP';
          
          if (!isUSD) return false;

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
            // Calculate dynamic balance from transactions to ensure accuracy (USD only)
            const pTxns = transactions.filter(t => t.projectId === p.id && t.currency !== 'SYP');
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

      // 4. Pending Expenses (USD Only)
      const pendingTxns = transactions.filter(t => t.status === 'Pending_Settlement' && t.type === TransactionType.PAYMENT && t.currency !== 'SYP');
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
      // FILTER USD
      const totalIncomeHistory = transactions.filter(t => t.type === TransactionType.RECEIPT && t.status === 'Completed' && t.currency !== 'SYP').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenseHistory = transactions.filter(t => t.type === TransactionType.PAYMENT && t.status === 'Completed' && t.currency !== 'SYP').reduce((sum, t) => sum + t.amount, 0);
      
      const simulatedMainTreasury = Math.max(0, (totalIncomeHistory - totalExpenseHistory) - totalProjectFunds - totalCustody); 

      // Total Actual Cash On Hand
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
              // USD Filter
              const monthTxns = transactions.filter(t => t.date.startsWith(monthPrefix) && t.currency !== 'SYP');
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
              // USD Filter
              const dayTxns = transactions.filter(t => t.date === dayStr && t.currency !== 'SYP');
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">التقارير المالية ($)</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">تحليل الأداء المالي والسيولة النقدية</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-dark-900 p-1 rounded-lg border border-gray-200 dark:border-dark-700">
            {['daily', 'monthly', 'annual'].map(type => (
                <button
                    key={type}
                    onClick={() => setReportType(type as any)}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${reportType === type ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
                >
                    {type === 'daily' ? 'يومي' : type === 'monthly' ? 'شهري' : 'سنوي'}
                </button>
            ))}
        </div>
      </div>

      {/* Filters based on Report Type */}
      <div className="bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800 flex flex-wrap gap-4 items-center">
          {reportType === 'daily' && (
              <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-400" />
                  <input 
                    type="date" 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-1.5 dark:bg-dark-950 dark:text-white"
                  />
              </div>
          )}
          {reportType === 'monthly' && (
              <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-500">الشهر:</span>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-1.5 dark:bg-dark-950 dark:text-white"
                  >
                      {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
              </div>
          )}
          <button className="mr-auto bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-dark-700 font-bold text-sm">
              <Download size={16} /> تصدير PDF
          </button>
      </div>

      {/* DAILY REPORT CONTENT */}
      {reportType === 'daily' && (
          <div className="space-y-6 animate-in fade-in">
              {/* Cash Position Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-600 to-green-800 text-white p-6 rounded-xl shadow-lg">
                      <p className="text-green-100 text-sm font-bold mb-1">إجمالي السيولة النقدية المتوفرة</p>
                      <h3 className="text-3xl font-extrabold">{formatCurrency(dailyReportData.totalCashOnHand)}</h3>
                      <p className="text-xs text-green-200 mt-2">تشمل الخزينة، العهد، وأرصدة المشاريع</p>
                  </div>
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">الخزينة الرئيسية</p>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(dailyReportData.mainTreasury)}</h3>
                  </div>
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">إجمالي عهد الموظفين</p>
                      <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(dailyReportData.totalCustody)}</h3>
                  </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Balances */}
                  <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-5">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <TrendingUp size={18} className="text-primary-600" />
                          أرصدة صناديق المشاريع (Workshop)
                      </h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                          {dailyReportData.projectsFunds.length > 0 ? dailyReportData.projectsFunds.map(p => (
                              <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700">
                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate w-1/2">{p.name}</span>
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold text-primary-700 dark:text-primary-400">{formatCurrency(p.balance)}</span>
                                      {p.isLow && <AlertTriangle size={14} className="text-red-500" title="الرصيد منخفض" />}
                                  </div>
                              </div>
                          )) : <p className="text-gray-400 text-sm text-center">لا توجد مشاريع نشطة</p>}
                      </div>
                  </div>

                  {/* Trusts & Custody */}
                  <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-5">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <PieChartIcon size={18} className="text-purple-600" />
                          الأمانات والعهد
                      </h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                          {dailyReportData.trusts.map((t, idx) => (
                              <div key={`tr-${idx}`} className="flex justify-between items-center p-2 border-b border-gray-50 dark:border-dark-800">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{t.name} (أمانة)</span>
                                  <span className={`font-bold text-sm ${t.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(t.balance)}</span>
                              </div>
                          ))}
                          {dailyReportData.employeeCustody.map((e, idx) => (
                              <div key={`emp-${idx}`} className="flex justify-between items-center p-2 border-b border-gray-50 dark:border-dark-800">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{e.name} (عهدة)</span>
                                  <span className="font-bold text-sm text-blue-600">{formatCurrency(e.balance)}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MONTHLY / ANNUAL REPORT CHARTS */}
      {(reportType === 'monthly' || reportType === 'annual') && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 h-96">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-6">تحليل الإيرادات والمصروفات</h3>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                          <XAxis dataKey="name" tick={{fontSize: 12}} />
                          <YAxis tick={{fontSize: 12}} />
                          <Tooltip contentStyle={{direction: 'rtl', borderRadius: '8px'}} />
                          <Legend wrapperStyle={{paddingTop: '20px'}} />
                          <Bar dataKey="إيرادات" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="مصروفات" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}
    </div>
  );
};

export default Reports;
