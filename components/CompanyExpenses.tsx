
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../services/dataService';
import { 
  Building2, 
  TrendingDown, 
  PlusCircle, 
  Search, 
  PieChart as PieChartIcon,
  FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Modal from './Modal';

interface CompanyExpensesProps {
    selectedYear?: number;
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

    // Filter Logic: Only 'General' / Overhead expenses
    const filteredExpenses = useMemo(() => {
        return transactions.filter(t => {
            const isOverhead = (!t.projectId || t.projectId === 'General' || t.projectId === 'N/A') && t.type === TransactionType.PAYMENT;
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.toAccount.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesYear = selectedYear ? t.date.startsWith(selectedYear.toString()) : true;
            return isOverhead && matchesSearch && matchesYear;
        });
    }, [transactions, searchTerm, selectedYear]);

    // Totals
    const totalOverhead = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Categorization Logic for Chart
    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {
            'إيجار': 0,
            'رواتب': 0,
            'كهرباء/ماء': 0,
            'تسويق': 0,
            'ضيافة': 0,
            'أخرى': 0
        };

        filteredExpenses.forEach(t => {
            const desc = t.description.toLowerCase();
            if (desc.includes('إيجار')) categories['إيجار'] += t.amount;
            else if (desc.includes('راتب') || desc.includes('أجور')) categories['رواتب'] += t.amount;
            else if (desc.includes('كهرباء') || desc.includes('ماء') || desc.includes('نت')) categories['كهرباء/ماء'] += t.amount;
            else if (desc.includes('تسويق') || desc.includes('إعلان')) categories['تسويق'] += t.amount;
            else if (desc.includes('ضيافة') || desc.includes('شاي') || desc.includes('قهوة')) categories['ضيافة'] += t.amount;
            else categories['أخرى'] += t.amount;
        });

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0);
    }, [filteredExpenses]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

    const handleSaveExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.description) return;

        const expense: Transaction = {
            id: `exp-${Date.now()}`,
            serialNumber: Math.floor(Math.random() * 10000), // Mock Serial
            type: TransactionType.PAYMENT,
            date: newExpense.date || new Date().toISOString().split('T')[0],
            amount: newExpense.amount,
            currency: 'USD',
            description: newExpense.description,
            fromAccount: newExpense.fromAccount || 'الخزينة الرئيسية',
            toAccount: newExpense.toAccount || 'مصروفات',
            projectId: 'General', // Force Overhead
            status: 'Completed'
        };

        onUpdateTransactions([expense, ...transactions]);
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
        alert("تم تسجيل المصروف الإداري بنجاح");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Building2 className="text-orange-600" />
                        مصاريف الشركة (التشغيلية)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">تتبع المصاريف الإدارية والعمومية الغير مرتبطة بمشاريع محددة</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                >
                    <PlusCircle size={20} />
                    <span className="font-bold">تسجيل مصروف إداري</span>
                </button>
            </div>

            {/* Stats & Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Total Card */}
                <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full text-orange-600 dark:text-orange-400">
                            <TrendingDown size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">إجمالي المصاريف التشغيلية</h3>
                    </div>
                    <p className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">{formatCurrency(totalOverhead)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">لسنة {selectedYear || new Date().getFullYear()}</p>
                </div>

                {/* Analysis Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-gray-400"/>
                        توزيع المصاريف حسب البند
                    </h3>
                    <div className="h-64 w-full" dir="ltr">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{direction: 'rtl'}} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                لا توجد بيانات كافية للرسم البياني
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                <div className="relative max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text"
                        placeholder="بحث في المصاريف الإدارية..."
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all dark:bg-dark-950 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">البند / الوصف</th>
                                <th className="px-6 py-4">الجهة المستفيدة</th>
                                <th className="px-6 py-4">من حساب</th>
                                <th className="px-6 py-4">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {filteredExpenses.map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{txn.date}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{txn.description}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.toAccount || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{txn.fromAccount}</td>
                                    <td className="px-6 py-4 font-bold text-orange-600 dark:text-orange-400">{formatCurrency(txn.amount)}</td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-400">لا توجد مصاريف إدارية مسجلة لهذه الفترة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تسجيل مصروف إداري جديد">
                <form onSubmit={handleSaveExpense} className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800 mb-2">
                        <p className="text-sm text-orange-800 dark:text-orange-300 flex items-center gap-2">
                            <FileText size={16} />
                            سيتم تسجيل هذا المصروف تلقائياً تحت بند <strong>"مصاريف عامة"</strong> ولن يؤثر على ميزانية أي مشروع.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ المصروف</label>
                        <input required type="date" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white dark:border-dark-700" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ ($)</label>
                        <input required type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white dark:border-dark-700 font-bold text-lg" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البيان (الوصف)</label>
                        <textarea required placeholder="مثال: فاتورة كهرباء المكتب، ضيافة، قرطاسية..." className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white dark:border-dark-700" rows={2} value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من حساب</label>
                            <select className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white dark:border-dark-700" value={newExpense.fromAccount} onChange={(e) => setNewExpense({...newExpense, fromAccount: e.target.value})}>
                                <option>الخزينة الرئيسية</option>
                                <option>عهدة موظف</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى (المستفيد)</label>
                            <input type="text" placeholder="شركة الكهرباء / مكتبة..." className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white dark:border-dark-700" value={newExpense.toAccount} onChange={(e) => setNewExpense({...newExpense, toAccount: e.target.value})} />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="submit" className="flex-1 bg-orange-600 text-white font-bold py-2.5 rounded-lg hover:bg-orange-700">حفظ المصروف</button>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg hover:bg-gray-200">إلغاء</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CompanyExpenses;
