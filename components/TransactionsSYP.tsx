
import React, { useState } from 'react';
import { formatCurrency } from '../services/dataService';
import { Transaction, TransactionType } from '../types';
import { Download, PlusCircle, ArrowUpRight, ArrowDownLeft, Search, TrendingDown, TrendingUp } from 'lucide-react';
import Modal from './Modal';

interface TransactionsSYPProps {
    transactions: Transaction[];
    onUpdateTransactions: (transactions: Transaction[]) => void;
}

const TransactionsSYP: React.FC<TransactionsSYPProps> = ({ transactions, onUpdateTransactions }) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'revenues'>('expenses');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTxn, setNewTxn] = useState<Partial<Transaction>>({
    amount: 0,
    currency: 'SYP',
    description: '',
    fromAccount: 'الصندوق اليومي', 
    toAccount: '',
    type: TransactionType.PAYMENT,
  });

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    const txn: Transaction = {
      id: `txn-syp-${Date.now()}`,
      type: newTxn.type as TransactionType,
      date: new Date().toISOString().split('T')[0],
      amount: newTxn.amount || 0,
      currency: 'SYP', // Explicitly SYP
      description: newTxn.description || '',
      fromAccount: newTxn.fromAccount || 'الصندوق اليومي',
      toAccount: newTxn.toAccount || '',
      projectId: 'N/A', 
      status: 'Completed'
    };

    onUpdateTransactions([txn, ...transactions]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTxn({ 
        amount: 0, 
        currency: 'SYP',
        description: '', 
        fromAccount: 'الصندوق اليومي', 
        toAccount: '', 
        type: TransactionType.PAYMENT,
    });
  }

  const handleOpenModal = () => {
    let defaultType = TransactionType.PAYMENT;
    if (activeTab === 'revenues') defaultType = TransactionType.RECEIPT;

    setNewTxn({ 
      amount: 0, 
      currency: 'SYP',
      description: '', 
      fromAccount: 'الصندوق اليومي', 
      toAccount: '', 
      type: defaultType,
    });
    setIsModalOpen(true);
  };

  // CRITICAL FIX: Filter only SYP transactions from the global list
  const filteredTransactions = transactions.filter(txn => {
    const isSYP = txn.currency === 'SYP';
    const matchesSearch = txn.description.includes(searchTerm) || txn.fromAccount.includes(searchTerm) || txn.toAccount.includes(searchTerm);
    let matchesType = false;

    if (activeTab === 'expenses') matchesType = txn.type === TransactionType.PAYMENT;
    else if (activeTab === 'revenues') matchesType = txn.type === TransactionType.RECEIPT;

    return isSYP && matchesType && matchesSearch;
  });

  // Calculations
  const sypTransactions = transactions.filter(t => t.currency === 'SYP');
  const totalIncome = sypTransactions.filter(t => t.type === TransactionType.RECEIPT).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = sypTransactions.filter(t => t.type === TransactionType.PAYMENT).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الحركات المالية (ليرة سورية)</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">دفتر يومية بسيط للمصاريف والإيرادات بالعملة المحلية</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي الإدخالات</p>
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome, 'SYP')}</h3>
          </div>
          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي المصاريف</p>
              <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(totalExpense, 'SYP')}</h3>
          </div>
          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">الرصيد المتبقي</p>
              <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance, 'SYP')}
              </h3>
          </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto max-w-md">
         <button 
           onClick={() => setActiveTab('expenses')}
           className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'expenses' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <TrendingDown size={18} />
           المصاريف
         </button>
         <button 
           onClick={() => setActiveTab('revenues')}
           className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'revenues' ? 'bg-green-50 text-green-600 shadow-sm border border-green-100' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
           <TrendingUp size={18} />
           الإيرادات
         </button>
      </div>

      {/* Actions & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800">
        <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="بحث في الحركات..." 
              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={handleOpenModal}
                className={`text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-bold ${
                    activeTab === 'expenses' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
            >
                <PlusCircle size={18} />
                <span>
                    {activeTab === 'expenses' ? 'تسجيل مصروف ل.س' : 'تسجيل إيراد ل.س'}
                </span>
            </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">النوع</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">الوصف</th>
                <th className="px-6 py-4 font-medium">من حساب</th>
                <th className="px-6 py-4 font-medium">إلى حساب</th>
                <th className="px-6 py-4 font-medium">المبلغ (ل.س)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                        txn.type === TransactionType.RECEIPT ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {txn.type === TransactionType.RECEIPT ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{txn.type === TransactionType.RECEIPT ? 'سند قبض' : 'سند صرف'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{txn.date}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                    {txn.description}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.fromAccount}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.toAccount}</td>
                  <td className={`px-6 py-4 font-bold ${
                    txn.type === TransactionType.RECEIPT ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {formatCurrency(txn.amount, 'SYP')}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                  <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400 dark:text-gray-600">
                          لا توجد حركات مسجلة
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* New Transaction Modal */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تسجيل حركة (ليرة سورية)">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الحركة</label>
            <select
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-100 dark:bg-dark-800 text-gray-500 cursor-not-allowed"
                value={newTxn.type}
            >
                <option value={TransactionType.PAYMENT}>مصروف (دفع)</option>
                <option value={TransactionType.RECEIPT}>إيراد (قبض)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ (ل.س)</label>
            <input 
              required
              type="number" 
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:text-white font-bold text-lg"
              value={newTxn.amount}
              onChange={(e) => setNewTxn({...newTxn, amount: Number(e.target.value)})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من حساب</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:text-white"
                  value={newTxn.fromAccount}
                  onChange={(e) => setNewTxn({...newTxn, fromAccount: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى حساب</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:text-white"
                  value={newTxn.toAccount}
                  onChange={(e) => setNewTxn({...newTxn, toAccount: e.target.value})}
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none dark:bg-dark-800 dark:text-white"
              value={newTxn.description}
              onChange={(e) => setNewTxn({...newTxn, description: e.target.value})}
            />
          </div>
          
          <div className="pt-2 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              حفظ
            </button>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransactionsSYP;
