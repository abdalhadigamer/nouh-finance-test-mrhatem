
import React, { useState } from 'react';
import { Trustee, TrustTransaction } from '../types';
import { MOCK_TRUST_TRANSACTIONS } from '../constants';
import { formatCurrency } from '../services/dataService';
import { ArrowRight, PlusCircle, MinusCircle, Wallet, Calendar, History, ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface TrustDetailsProps {
  trustee: Trustee;
  onBack: () => void;
}

const TrustDetails: React.FC<TrustDetailsProps> = ({ trustee, onBack }) => {
  // Local state for transactions to allow adding new ones
  const [transactions, setTransactions] = useState<TrustTransaction[]>(
      MOCK_TRUST_TRANSACTIONS.filter(t => t.trusteeId === trustee.id)
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txnType, setTxnType] = useState<'Deposit' | 'Withdrawal'>('Deposit');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculations
  const totalDeposits = transactions.filter(t => t.type === 'Deposit').reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'Withdrawal').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalDeposits - totalWithdrawals;
  const isDeficit = balance < 0;

  const handleSaveTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (amount <= 0) return;

      const newTxn: TrustTransaction = {
          id: `tt-${Date.now()}`,
          trusteeId: trustee.id,
          type: txnType,
          amount: amount,
          date: date,
          notes: notes
      };

      setTransactions([newTxn, ...transactions]);
      // Also update mock data in a real app
      MOCK_TRUST_TRANSACTIONS.unshift(newTxn);
      
      setIsModalOpen(false);
      setAmount(0);
      setNotes('');
  };

  const openModal = (type: 'Deposit' | 'Withdrawal') => {
      setTxnType(type);
      setAmount(0);
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
        >
          <ArrowRight size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">صندوق الأمانة: {trustee.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">كشف حساب تفصيلي للإيداعات والمسحوبات</p>
        </div>
      </div>

      {/* Balance Card - Dynamic Color */}
      <div className={`rounded-2xl p-8 text-white shadow-lg relative overflow-hidden transition-colors duration-500 ${isDeficit ? 'bg-gradient-to-br from-red-600 to-red-900' : 'bg-gradient-to-br from-teal-600 to-teal-800'}`}>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <p className={`text-sm font-bold mb-1 opacity-90 flex items-center gap-2 ${isDeficit ? 'text-red-100' : 'text-teal-100'}`}>
                      {isDeficit ? (
                          <>
                            <AlertTriangle size={16} />
                            عجز (مطلوب من صاحب الأمانة)
                          </>
                      ) : (
                          "الرصيد الحالي (المحفوظ لدينا)"
                      )}
                  </p>
                  <h2 className="text-5xl font-bold tracking-tight" dir="ltr">{formatCurrency(balance)}</h2>
                  {isDeficit && <p className="text-xs text-red-200 mt-2 font-bold bg-red-900/30 px-2 py-1 rounded w-fit">تم كسر الصندوق (سحب زائد)</p>}
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={() => openModal('Deposit')}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg ${isDeficit ? 'bg-white text-red-800 hover:bg-red-50' : 'bg-white text-teal-800 hover:bg-teal-50'}`}
                  >
                      <PlusCircle size={20} />
                      إيداع أمانة (قبض)
                  </button>
                  <button 
                    onClick={() => openModal('Withdrawal')}
                    className={`border px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${isDeficit ? 'bg-red-900/50 text-white border-red-400/30 hover:bg-red-900/70' : 'bg-teal-900/50 text-white border-teal-400/30 hover:bg-teal-900/70'}`}
                  >
                      <MinusCircle size={20} />
                      إرجاع مبلغ (صرف)
                  </button>
              </div>
          </div>
      </div>

      {/* History */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <History className="text-gray-400" />
                  سجل الحركات
              </h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                  <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                      <tr>
                          <th className="px-6 py-4">التاريخ</th>
                          <th className="px-6 py-4">نوع الحركة</th>
                          <th className="px-6 py-4">الوصف / ملاحظات</th>
                          <th className="px-6 py-4">المبلغ</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                      {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(txn => (
                          <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                              <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{txn.date}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${txn.type === 'Deposit' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                      {txn.type === 'Deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                      {txn.type === 'Deposit' ? 'إيداع (قبض)' : 'سحب (إرجاع)'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">{txn.notes}</td>
                              <td className={`px-6 py-4 font-bold text-lg ${txn.type === 'Deposit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {txn.type === 'Deposit' ? '+' : '-'} {formatCurrency(txn.amount)}
                              </td>
                          </tr>
                      ))}
                      {transactions.length === 0 && (
                          <tr>
                              <td colSpan={4} className="text-center py-12 text-gray-400">لا توجد حركات مسجلة لهذا الشخص</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={txnType === 'Deposit' ? 'تسجيل إيداع أمانة' : 'تسجيل إرجاع مبلغ'}>
          <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className={`p-4 rounded-lg mb-4 text-sm font-bold flex items-center gap-2 ${txnType === 'Deposit' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                  <Wallet size={18} />
                  {txnType === 'Deposit' 
                      ? 'سيتم إضافة هذا المبلغ إلى رصيد الأمانة (التزام عليك).' 
                      : 'سيتم خصم هذا المبلغ من رصيد الأمانة. (ملاحظة: إذا تجاوز الرصيد سيصبح الصندوق مكسوراً/بالسالب)'}
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الحركة</label>
                  <input 
                      type="date" 
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-dark-950 dark:text-white"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
                  <input 
                      type="number" 
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-dark-950 dark:text-white font-bold text-lg"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      required
                      min={1}
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات / وصف</label>
                  <textarea 
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-dark-950 dark:text-white"
                      placeholder="مثال: دفعة نقدية للحفظ، استلام يدوي، مصاريف..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                  />
              </div>

              <div className="pt-2 flex gap-3">
                  <button type="submit" className={`flex-1 text-white font-bold py-2.5 rounded-lg transition-colors ${txnType === 'Deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                      حفظ العملية
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors">
                      إلغاء
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default TrustDetails;
