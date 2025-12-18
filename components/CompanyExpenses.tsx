
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../services/dataService';
import { Building2, Plus, Search, Trash2 } from 'lucide-react';
import Modal from './Modal';

interface CompanyExpensesProps {
    selectedYear: number;
    transactions: Transaction[];
    onUpdateTransactions: (transactions: Transaction[]) => void;
}

const CompanyExpenses: React.FC<CompanyExpensesProps> = ({ selectedYear, transactions, onUpdateTransactions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Expense State
    const [newExpense, setNewExpense] = useState<Partial<Transaction>>({
        amount: 0,
        currency: 'USD',
        description: '',
        fromAccount: 'الخزينة الرئيسية',
        toAccount: '',
        type: TransactionType.PAYMENT,
        projectId: 'General', // HARDCODED for this page
        date: new Date().toISOString().split('T')[0]
    });

    // Filter Logic: Only 'General' / Overhead expenses AND USD Only
    const filteredExpenses = useMemo(() => {
        return transactions.filter(t => {
            const isOverhead = (!t.projectId || t.projectId === 'General' || t.projectId === 'N/A') && t.type === TransactionType.PAYMENT;
            const isUSD = t.currency !== 'SYP';
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.toAccount.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesYear = selectedYear ? t.date.startsWith(selectedYear.toString()) : true;
            return isOverhead && isUSD && matchesSearch && matchesYear;
        });
    }, [transactions, searchTerm, selectedYear]);

    // Totals
    const totalOverhead = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.description) return;

        const txn: Transaction = {
            id: `exp-${Date.now()}`,
            type: TransactionType.PAYMENT,
            currency: 'USD',
            projectId: 'General',
            amount: newExpense.amount || 0,
            date: newExpense.date || new Date().toISOString().split('T')[0],
            description: newExpense.description || '',
            fromAccount: newExpense.fromAccount || 'الخزينة الرئيسية',
            toAccount: newExpense.toAccount || 'مصروفات عامة',
            status: 'Completed'
        };

        onUpdateTransactions([txn, ...transactions]);
        setIsModalOpen(false);
        setNewExpense({
            amount: 0,
            currency: 'USD',
            description: '',
            fromAccount: 'الخزينة الرئيسية',
            toAccount: '',
            type: TransactionType.PAYMENT,
            projectId: 'General',
            date: new Date().toISOString().split('T')[0]
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Building2 className="text-orange-600" />
                        مصاريف الشركة (Overhead)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">المصاريف التشغيلية العامة غير المرتبطة بمشروع محدد</p>
                </div>
                <div className="bg-white dark:bg-dark-900 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                    <span className="text-gray-500 text-xs font-bold block">إجمالي المصاريف ({selectedYear})</span>
                    <span className="text-xl font-bold text-red-600">{formatCurrency(totalOverhead)}</span>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="بحث في المصاريف..." 
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-colors"
                >
                    <Plus size={20} />
                    <span>تسجيل مصروف</span>
                </button>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">الوصف</th>
                                <th className="px-6 py-4">التصنيف / المستفيد</th>
                                <th className="px-6 py-4">المبلغ</th>
                                <th className="px-6 py-4">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {filteredExpenses.map(txn => (
                                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{txn.date}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{txn.description}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.toAccount}</td>
                                    <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(txn.amount)}</td>
                                    <td className="px-6 py-4">
                                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-400">لا توجد مصاريف مسجلة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تسجيل مصروف تشغيلي عام">
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ ($)</label>
                        <input 
                            required
                            type="number" 
                            step="0.01"
                            className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white font-bold"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white"
                            placeholder="مثال: فاتورة كهرباء المكتب، إيجار..."
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المستفيد / إلى حساب</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white"
                                value={newExpense.toAccount}
                                onChange={(e) => setNewExpense({...newExpense, toAccount: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white"
                                value={newExpense.date}
                                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="submit" className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700">حفظ المصروف</button>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-200">إلغاء</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CompanyExpenses;
