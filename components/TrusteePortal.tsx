
import React, { useMemo } from 'react';
import { Trustee, TrustTransaction } from '../types';
import { formatCurrency } from '../services/dataService';
import { LogOut, Shield, ArrowDownLeft, ArrowUpRight, History, Calendar, User } from 'lucide-react';

interface TrusteePortalProps {
  trustee: Trustee;
  onLogout: () => void;
  trustTransactions: TrustTransaction[]; // Receiving live transactions
}

const TrusteePortal: React.FC<TrusteePortalProps> = ({ trustee, onLogout, trustTransactions }) => {
  
  // Calculate Balance and Transactions based on LIVE prop
  const { transactions, balance, totalDeposits, totalWithdrawals } = useMemo(() => {
      const txns = trustTransactions
        .filter(t => t.trusteeId === trustee.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
      const deposits = txns.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = txns.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);
      
      return {
          transactions: txns,
          balance: deposits - withdrawals,
          totalDeposits: deposits,
          totalWithdrawals: withdrawals
      };
  }, [trustee.id, trustTransactions]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 font-cairo text-right transition-colors" dir="rtl">
        {/* Header */}
        <header className="bg-teal-800 text-white shadow-lg sticky top-0 z-20">
            <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">بوابة الأمانات</h1>
                        <p className="text-xs text-teal-200">مرحباً، {trustee.name}</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-red-500/20"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">خروج</span>
                </button>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
            
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                <div className="relative z-10 text-center md:text-right">
                    <p className="text-teal-100 text-sm font-bold mb-2 opacity-80">رصيد الأمانة الحالي (المحفوظ)</p>
                    <h2 className="text-5xl font-extrabold tracking-tight mb-6">{formatCurrency(balance)}</h2>
                    
                    <div className="flex flex-col md:flex-row gap-4 md:gap-12 mt-4 pt-4 border-t border-teal-500/30 justify-center md:justify-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500/20 rounded-full">
                                <ArrowDownLeft className="text-green-300" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-teal-200">إجمالي الإيداعات</p>
                                <p className="font-bold text-lg">{formatCurrency(totalDeposits)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500/20 rounded-full">
                                <ArrowUpRight className="text-red-300" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-teal-200">إجمالي المسحوبات</p>
                                <p className="font-bold text-lg">{formatCurrency(totalWithdrawals)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <History className="text-teal-600" />
                        سجل الحركات
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-800 px-2 py-1 rounded">
                        {transactions.length} عملية
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">نوع الحركة</th>
                                <th className="px-6 py-4">الوصف</th>
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
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${txn.type === 'Deposit' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                            {txn.type === 'Deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                            {txn.type === 'Deposit' ? 'إيداع' : 'سحب'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                                        {txn.notes}
                                    </td>
                                    <td className={`px-6 py-4 font-bold text-lg ${txn.type === 'Deposit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {txn.type === 'Deposit' ? '+' : '-'} {formatCurrency(txn.amount)}
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

            <div className="text-center text-gray-400 text-xs mt-8">
                <p>في حال وجود أي ملاحظة على الرصيد، يرجى التواصل مع الإدارة.</p>
            </div>
        </main>
    </div>
  );
};

export default TrusteePortal;
