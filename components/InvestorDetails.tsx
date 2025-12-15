
import React, { useState } from 'react';
import { Investor, InvestorTransaction, ProjectType, ProjectStatus } from '../types';
import { MOCK_INVESTOR_TRANSACTIONS, MOCK_PROJECTS } from '../constants';
import { formatCurrency } from '../services/dataService';
import { ArrowRight, PlusCircle, MinusCircle, Wallet, Calendar, History, ArrowDownLeft, ArrowUpRight, TrendingUp, Edit, Coins, HardHat } from 'lucide-react';
import Modal from './Modal';

interface InvestorDetailsProps {
  investor: Investor;
  onBack: () => void;
  onUpdateInvestor?: (investor: Investor) => void; // New Prop
}

const InvestorDetails: React.FC<InvestorDetailsProps> = ({ investor, onBack, onUpdateInvestor }) => {
  // Local state for transactions
  const [transactions, setTransactions] = useState<InvestorTransaction[]>(
      MOCK_INVESTOR_TRANSACTIONS.filter(t => t.investorId === investor.id)
  );

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txnType, setTxnType] = useState<'Capital_Injection' | 'Profit_Distribution' | 'Withdrawal'>('Capital_Injection');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Investor Modals
  const [isEditPercentOpen, setIsEditPercentOpen] = useState(false);
  const [newProfitPercent, setNewProfitPercent] = useState(investor.profitPercentage || 0);
  
  const [isManageProjectsOpen, setIsManageProjectsOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(investor.linkedProjectIds || []);

  // Calculations
  const totalCapital = transactions.filter(t => t.type === 'Capital_Injection').reduce((acc, t) => acc + t.amount, 0);
  const totalProfit = transactions.filter(t => t.type === 'Profit_Distribution').reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => t.type === 'Withdrawal').reduce((acc, t) => acc + t.amount, 0);
  
  // Current Balance = (Capital + Profit) - Withdrawn
  const balance = (totalCapital + totalProfit) - totalWithdrawn;

  // Filter Execution Projects for the Modal
  const executionProjects = MOCK_PROJECTS.filter(p => p.type === ProjectType.EXECUTION || p.status === ProjectStatus.EXECUTION);

  const handleSaveTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (amount <= 0) return;

      const newTxn: InvestorTransaction = {
          id: `it-${Date.now()}`,
          investorId: investor.id,
          type: txnType,
          amount: amount,
          date: date,
          notes: notes
      };

      setTransactions([newTxn, ...transactions]);
      MOCK_INVESTOR_TRANSACTIONS.unshift(newTxn);
      
      setIsModalOpen(false);
      setAmount(0);
      setNotes('');
  };

  const handleSavePercentage = (e: React.FormEvent) => {
      e.preventDefault();
      if (onUpdateInvestor) {
          onUpdateInvestor({ ...investor, profitPercentage: newProfitPercent });
      }
      setIsEditPercentOpen(false);
  };

  const handleSaveProjects = (e: React.FormEvent) => {
      e.preventDefault();
      if (onUpdateInvestor) {
          onUpdateInvestor({ ...investor, linkedProjectIds: selectedProjectIds });
      }
      setIsManageProjectsOpen(false);
  };

  const toggleProjectSelection = (id: string) => {
      if (selectedProjectIds.includes(id)) {
          setSelectedProjectIds(selectedProjectIds.filter(pid => pid !== id));
      } else {
          setSelectedProjectIds([...selectedProjectIds, id]);
      }
  };

  const openModal = (type: 'Capital_Injection' | 'Profit_Distribution' | 'Withdrawal') => {
      setTxnType(type);
      setAmount(0);
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsModalOpen(true);
  };

  const getModalTitle = () => {
      switch (txnType) {
          case 'Capital_Injection': return 'تسجيل إيداع رأس مال';
          case 'Profit_Distribution': return 'توزيع أرباح للمستثمر';
          case 'Withdrawal': return 'تسجيل سحب نقدي';
          default: return '';
      }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <button 
            onClick={onBack}
            className="p-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
            <ArrowRight size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                {investor.name}
                <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${investor.type === 'Capital' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                    {investor.type === 'Capital' ? <Coins size={12}/> : <HardHat size={12}/>}
                    {investor.type === 'Capital' ? 'مستثمر مالي' : 'شريك تنفيذي'}
                </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{investor.agreementDetails}</p>
            </div>
        </div>

        {/* Specific Type Actions/Info */}
        <div className="flex gap-2">
            {investor.type === 'Capital' ? (
                <button 
                    onClick={() => setIsEditPercentOpen(true)}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-200 transition-colors"
                >
                    <Edit size={16} />
                    نسبة الربح: {investor.profitPercentage || 0}%
                </button>
            ) : (
                <button 
                    onClick={() => setIsManageProjectsOpen(true)}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-200 transition-colors"
                >
                    <Edit size={16} />
                    المشاريع المرتبطة: {investor.linkedProjectIds?.length || 0}
                </button>
            )}
        </div>
      </div>

      {/* Linked Projects Display (For Partners) */}
      {investor.type === 'Partner' && investor.linkedProjectIds && investor.linkedProjectIds.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">المشاريع التنفيذية المرتبطة (مصدر الأرباح)</h4>
              <div className="flex flex-wrap gap-2">
                  {investor.linkedProjectIds.map(pid => {
                      const proj = MOCK_PROJECTS.find(p => p.id === pid);
                      return proj ? (
                          <span key={pid} className="bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs border border-gray-200 dark:border-dark-700 shadow-sm">
                              {proj.name}
                          </span>
                      ) : null;
                  })}
              </div>
          </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">رأس المال المودع</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(totalCapital)}</h3>
          </div>
          <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">إجمالي الأرباح الموزعة</p>
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</h3>
          </div>
          <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">إجمالي المسحوبات</p>
              <h3 className="text-2xl font-bold text-red-600">{formatCurrency(totalWithdrawn)}</h3>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-5 rounded-2xl shadow-lg text-white">
              <p className="text-purple-100 text-sm font-bold mb-1">صافي الرصيد الحالي</p>
              <h3 className="text-3xl font-bold">{formatCurrency(balance)}</h3>
          </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800">
          <button onClick={() => openModal('Capital_Injection')} className="flex items-center gap-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-bold transition-colors">
              <PlusCircle size={18} className="text-gray-600 dark:text-gray-400" />
              إيداع رأس مال
          </button>
          <button onClick={() => openModal('Profit_Distribution')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
              <TrendingUp size={18} />
              توزيع أرباح
          </button>
          <button onClick={() => openModal('Withdrawal')} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
              <MinusCircle size={18} />
              سحب نقدي
          </button>
      </div>

      {/* History */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <History className="text-gray-400" />
                  سجل الحركات المالية
              </h3>
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
                      {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(txn => (
                          <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                              <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{txn.date}</td>
                              <td className="px-6 py-4">
                                  {txn.type === 'Capital_Injection' && <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">إيداع رأس مال</span>}
                                  {txn.type === 'Profit_Distribution' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">توزيع أرباح</span>}
                                  {txn.type === 'Withdrawal' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">سحب نقدي</span>}
                              </td>
                              <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">{txn.notes}</td>
                              <td className={`px-6 py-4 font-bold text-lg ${txn.type === 'Withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                                  {txn.type === 'Withdrawal' ? '-' : '+'} {formatCurrency(txn.amount)}
                              </td>
                          </tr>
                      ))}
                      {transactions.length === 0 && (
                          <tr>
                              <td colSpan={4} className="text-center py-12 text-gray-400">لا توجد حركات مسجلة</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={getModalTitle()}>
          <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="bg-gray-50 dark:bg-dark-800 p-3 rounded-lg border border-gray-100 dark:border-dark-700 text-sm">
                  {txnType === 'Capital_Injection' && 'يؤدي هذا الإجراء إلى زيادة رصيد رأس المال للمستثمر.'}
                  {txnType === 'Profit_Distribution' && 'يؤدي هذا الإجراء إلى زيادة رصيد المستثمر (توزيع من أرباح الشركة).'}
                  {txnType === 'Withdrawal' && 'يؤدي هذا الإجراء إلى خصم من رصيد المستثمر (دفع نقدي).'}
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ العملية</label>
                  <input 
                      type="date" 
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-dark-950 dark:text-white"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
                  <input 
                      type="number" 
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-dark-950 dark:text-white font-bold text-lg"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      required
                      min={1}
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات / بيان</label>
                  <textarea 
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-dark-950 dark:text-white"
                      placeholder={txnType === 'Profit_Distribution' ? "مثال: أرباح مشروع البرج، أرباح سنوية..." : "وصف للعملية..."}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                  />
              </div>

              <div className="pt-2 flex gap-3">
                  <button type="submit" className={`flex-1 text-white font-bold py-2.5 rounded-lg transition-colors bg-purple-600 hover:bg-purple-700`}>
                      حفظ العملية
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors">
                      إلغاء
                  </button>
              </div>
          </form>
      </Modal>

      {/* Edit Percent Modal (Capital) */}
      <Modal isOpen={isEditPercentOpen} onClose={() => setIsEditPercentOpen(false)} title="تعديل نسبة الربح">
          <form onSubmit={handleSavePercentage} className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-800 text-sm text-purple-800 dark:text-purple-300">
                  <p>تغيير النسبة ينطبق على توزيعات الأرباح المستقبلية.</p>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسبة الربح (%)</label>
                  <input 
                      type="number" 
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-950 dark:text-white font-bold text-lg"
                      value={newProfitPercent}
                      onChange={(e) => setNewProfitPercent(Number(e.target.value))}
                      required
                  />
              </div>
              <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-lg">حفظ التغييرات</button>
                  <button type="button" onClick={() => setIsEditPercentOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg">إلغاء</button>
              </div>
          </form>
      </Modal>

      {/* Manage Linked Projects Modal (Partner) */}
      <Modal isOpen={isManageProjectsOpen} onClose={() => setIsManageProjectsOpen(false)} title="إدارة المشاريع المرتبطة">
          <form onSubmit={handleSaveProjects} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                  <p>حدد المشاريع التنفيذية التي يستحق هذا الشريك نسبة أرباح منها.</p>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar bg-white dark:bg-dark-950 p-3 rounded-lg border border-gray-200 dark:border-dark-700">
                  {executionProjects.length > 0 ? executionProjects.map(proj => (
                      <label key={proj.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg transition-colors">
                          <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900"
                              checked={selectedProjectIds.includes(proj.id)}
                              onChange={() => toggleProjectSelection(proj.id)}
                          />
                          <div>
                              <span className="block font-bold text-gray-800 dark:text-white">{proj.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{proj.location} • {formatCurrency(proj.budget)}</span>
                          </div>
                      </label>
                  )) : (
                      <p className="text-center text-gray-400 py-4">لا توجد مشاريع تنفيذية متاحة</p>
                  )}
              </div>

              <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg">حفظ التعديلات</button>
                  <button type="button" onClick={() => setIsManageProjectsOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg">إلغاء</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default InvestorDetails;
