
import React, { useMemo } from 'react';
import { Investor, InvestorTransaction } from '../types';
import { formatCurrency } from '../services/dataService';
import { LogOut, TrendingUp, ArrowDownLeft, ArrowUpRight, History, Calendar, Wallet } from 'lucide-react';

interface InvestorPortalProps {
  investor: Investor;
  onLogout: () => void;
  investorTransactions: InvestorTransaction[]; // Receiving live transactions
}

const InvestorPortal: React.FC<InvestorPortalProps> = ({ investor, onLogout, investorTransactions }) => {
  
  // Calculate Balance and Stats based on LIVE prop
  const { transactions, balance, totalCapital, totalProfit, totalWithdrawn } = useMemo(() => {
      const txns = investorTransactions
        .filter(t => t.investorId === investor.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
      const capital = txns.filter(t => t.type === 'Capital_Injection').reduce((sum, t) => sum + t.amount, 0);
      const profit = txns.filter(t => t.type === 'Profit_Distribution').reduce((sum, t) => sum + t.amount, 0);
      const withdrawn = txns.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);
      
      return {
          transactions: txns,
          balance: (capital + profit) - withdrawn,
          totalCapital: capital,
          totalProfit: profit,
          totalWithdrawn: withdrawn
      };
  }, [investor.id, investorTransactions]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 font-cairo text-right transition-colors" dir="rtl">
        {/* Header */}
        <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-20 border-b border-gray-800">
            <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <TrendingUp className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-100">بوابة الشركاء والمستثمرين</h1>
                        <p className="text-xs text-gray-400">مرحباً، {investor.name}</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-white/10"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">خروج</span>
                </button>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            
            {/* Balance Card - Premium Look */}
            <div className="bg-gradient-to-br from-gray-800 to-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-gray-700">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 text-center md:text-right">
                    <p className="text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">صافي الرصيد المستحق</p>
                    <h2 className="text-5xl font-extrabold tracking-tight mb-8 text-yellow-500">{formatCurrency(balance)}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-700 rounded-lg">
                                <Wallet className="text-gray-300" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">رأس المال</p>
                                <p className="font-bold text-lg text-white">{formatCurrency(totalCapital)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-900/40 rounded-lg">
                                <ArrowDownLeft className="text-green-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-green-400/80">الأرباح الموزعة</p>
                                <p className="font-bold text-lg text-green-400">+{formatCurrency(totalProfit)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-900/40 rounded-lg">
                                <ArrowUpRight className="text-red-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-red-400/80">المسحوبات</p>
                                <p className="font-bold text-lg text-red-400">-{formatCurrency(totalWithdrawn)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <History className="text-gray-500" />
                        سجل العمليات
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">البيان</th>
                                <th className="px-6 py-4">النوع</th>
                                <th className="px-6 py-4">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {transactions.map(txn => (
                                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {txn.date}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                                        {txn.notes}
                                    </td>
                                    <td className="px-6 py-4">
                                        {txn.type === 'Capital_Injection' && <span className="text-xs font-bold text-gray-600 bg-gray-100 dark:bg-dark-700 dark:text-gray-300 px-2 py-1 rounded">إيداع رأس مال</span>}
                                        {txn.type === 'Profit_Distribution' && <span className="text-xs font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded">توزيع أرباح</span>}
                                        {txn.type === 'Withdrawal' && <span className="text-xs font-bold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded">سحب</span>}
                                    </td>
                                    <td className={`px-6 py-4 font-bold text-lg ${txn.type === 'Withdrawal' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {txn.type === 'Withdrawal' ? '-' : '+'} {formatCurrency(txn.amount)}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-gray-400">
                                        لا توجد حركات مسجلة حتى الآن
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
  );
};

export default InvestorPortal;
