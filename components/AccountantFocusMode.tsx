
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Transaction, TransactionType, Project, User } from '../types';
import { formatCurrency } from '../services/dataService';
import { Save, X, Plus, Trash2, ArrowLeft, Keyboard, Zap, CheckCircle, Coins } from 'lucide-react';

interface AccountantFocusModeProps {
  onBack: () => void;
  onSaveBulk: (transactions: Transaction[]) => void; // Changed from direct update to bulk handler
  projects: Project[];
  currentUser?: User;
}

interface TempTransaction {
  id: string;
  date: string;
  type: TransactionType;
  currency: 'USD' | 'SYP';
  amount: string;
  description: string;
  projectId: string;
  fromAccount: string;
  toAccount: string;
  isValid: boolean;
}

const AccountantFocusMode: React.FC<AccountantFocusModeProps> = ({ onBack, onSaveBulk, projects, currentUser }) => {
  const [rows, setRows] = useState<TempTransaction[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    addNewRows(5);
  }, []);

  const addNewRows = (count: number) => {
    const newRows: TempTransaction[] = Array.from({ length: count }).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.PAYMENT,
      currency: 'USD',
      amount: '',
      description: '',
      projectId: '',
      fromAccount: 'الخزينة الرئيسية',
      toAccount: '',
      isValid: false
    }));
    setRows(prev => [...prev, ...newRows]);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: string) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSaveAll();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < rows.length) {
        focusCell(nextRow, field);
      } else {
        addNewRows(1);
        setTimeout(() => focusCell(nextRow, field), 50);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < rows.length) focusCell(nextRow, field);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) focusCell(prevRow, field);
    } else if (e.key === 'Delete' && e.ctrlKey) {
        handleDeleteRow(rows[rowIndex].id);
    }
  };

  const focusCell = (rowIndex: number, field: string) => {
    const selector = `input[data-row="${rowIndex}"][data-field="${field}"], select[data-row="${rowIndex}"][data-field="${field}"]`;
    const element = gridRef.current?.querySelector(selector) as HTMLElement;
    element?.focus();
  };

  const updateRow = (id: string, field: keyof TempTransaction, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        updated.isValid = !!(updated.amount && parseFloat(updated.amount) > 0 && updated.description);
        return updated;
      }
      return row;
    }));
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveAll = () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
        alert("لا توجد صفوف مكتملة البيانات للحفظ.");
        return;
    }

    const newTransactions: Transaction[] = validRows.map((r, index) => ({
        id: `txn-bulk-${Date.now()}-${index}`,
        type: r.type,
        date: r.date,
        amount: parseFloat(r.amount),
        currency: r.currency,
        description: r.description,
        fromAccount: r.fromAccount,
        toAccount: r.toAccount || (r.type === TransactionType.RECEIPT ? 'الخزينة' : 'مصروفات'),
        projectId: r.projectId || 'General',
        status: 'Completed',
        serialNumber: Math.floor(Math.random() * 90000) + 10000
    }));

    onSaveBulk(newTransactions);
    setSavedCount(prev => prev + newTransactions.length);
    
    const remaining = rows.filter(r => !r.isValid);
    if (remaining.length < 5) {
        const newEmpty: TempTransaction[] = Array.from({ length: 5 - remaining.length }).map(() => ({
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            type: TransactionType.PAYMENT,
            currency: 'USD',
            amount: '',
            description: '',
            projectId: '',
            fromAccount: 'الخزينة الرئيسية',
            toAccount: '',
            isValid: false
        }));
        setRows([...remaining, ...newEmpty]);
    } else {
        setRows(remaining);
    }
    
    alert(`تم حفظ ${newTransactions.length} قيد بنجاح وتوزيعها على الدفاتر المناسبة!`);
  };

  const activeProjects = projects.filter(p => p.status !== 'تم التسليم' && p.status !== 'متوقف');

  return (
    <div className="fixed inset-0 bg-white dark:bg-dark-950 z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      <div className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-yellow-500 rounded-lg text-gray-900">
                <Zap size={24} fill="currentColor" />
            </div>
            <div>
                <h1 className="text-xl font-bold font-cairo">وضع التركيز (الإدخال السريع)</h1>
                <p className="text-xs text-gray-400 font-mono">Keyboard Mode: Active</p>
            </div>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-white font-mono">Enter</kbd> الخلية التالية</span>
                <span className="flex items-center gap-1"><kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-white font-mono">Ctrl + S</kbd> حفظ وترحيل</span>
                <span className="flex items-center gap-1"><kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-white font-mono">Arrows</kbd> تنقل</span>
            </div>
            <div className="h-8 w-px bg-gray-700 mx-2"></div>
            <button onClick={onBack} className="flex items-center gap-2 hover:text-red-400 transition-colors">
                <X size={20} />
                <span>خروج</span>
            </button>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 p-2 flex justify-between items-center text-sm px-6">
          <div className="flex gap-4">
              <span className="text-gray-600 dark:text-gray-400">إجمالي القيود في الجلسة: <strong className="text-green-600">{savedCount}</strong></span>
              <span className="text-gray-600 dark:text-gray-400">صفوف جاهزة للحفظ: <strong className="text-blue-600">{rows.filter(r => r.isValid).length}</strong></span>
          </div>
          <button 
            onClick={handleSaveAll}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-1.5 rounded-md font-bold flex items-center gap-2 shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
              <Save size={16} />
              حفظ الكل ({rows.filter(r => r.isValid).length})
          </button>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-dark-950 p-4" ref={gridRef}>
          <div className="min-w-[1200px] bg-white dark:bg-dark-900 rounded-lg shadow-sm border border-gray-300 dark:border-dark-700">
              <div className="grid grid-cols-[40px_130px_100px_80px_120px_2fr_1.5fr_1.5fr_1.5fr_40px] bg-gray-100 dark:bg-dark-800 border-b border-gray-300 dark:border-dark-700 text-sm font-bold text-gray-700 dark:text-gray-300 sticky top-0 z-10 shadow-sm">
                  <div className="p-3 text-center border-l border-gray-200 dark:border-dark-700">#</div>
                  <div className="p-3 border-l border-gray-200 dark:border-dark-700">التاريخ</div>
                  <div className="p-3 border-l border-gray-200 dark:border-dark-700">النوع</div>
                  <div className="p-3 border-l border-gray-200 dark:border-dark-700">العملة</div>
                  <div className="p-3 border-l border-gray-200 dark:border-dark-700">المبلغ</div>
                  <div className="p-3 border-l border-gray-200 dark:border-dark-700">البيان / الوصف</div>
                  <div className="p-3 border-l border-gray-200 dark:border-dark-700">المشروع</div>
                  <div className="p-3 border-l border-gray-200 dark:border-dark-700">من حساب</div>
                  <div className="p-3 border-l border-gray-200 dark:border-dark-700">إلى حساب</div>
                  <div className="p-3 text-center"></div>
              </div>

              {rows.map((row, index) => (
                  <div 
                    key={row.id} 
                    className={`grid grid-cols-[40px_130px_100px_80px_120px_2fr_1.5fr_1.5fr_1.5fr_40px] border-b border-gray-200 dark:border-dark-800 hover:bg-blue-50 dark:hover:bg-dark-800/50 transition-colors group ${row.isValid ? 'bg-green-50/30 dark:bg-green-900/5' : ''}`}
                  >
                      <div className="p-0 flex items-center justify-center border-l border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-900 text-xs text-gray-400">
                          {index + 1}
                      </div>

                      <div className="p-0 border-l border-gray-200 dark:border-dark-800">
                          <input 
                            type="date"
                            data-row={index}
                            data-field="date"
                            className="w-full h-full px-2 bg-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-inset focus:ring-primary-500 outline-none text-sm dark:text-white font-mono"
                            value={row.date}
                            onChange={e => updateRow(row.id, 'date', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, 'date')}
                          />
                      </div>

                      <div className="p-0 border-l border-gray-200 dark:border-dark-800">
                          <select
                            data-row={index}
                            data-field="type"
                            className={`w-full h-full px-1 bg-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-inset focus:ring-primary-500 outline-none text-xs font-bold ${row.type === TransactionType.PAYMENT ? 'text-red-600' : 'text-green-600'}`}
                            value={row.type}
                            onChange={e => updateRow(row.id, 'type', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, 'type')}
                          >
                              <option value={TransactionType.PAYMENT}>صرف</option>
                              <option value={TransactionType.RECEIPT}>قبض</option>
                          </select>
                      </div>

                      <div className="p-0 border-l border-gray-200 dark:border-dark-800">
                          <select
                            data-row={index}
                            data-field="currency"
                            className="w-full h-full px-1 bg-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-inset focus:ring-primary-500 outline-none text-xs font-bold text-gray-700 dark:text-gray-300"
                            value={row.currency}
                            onChange={e => updateRow(row.id, 'currency', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, 'currency')}
                          >
                              <option value="USD">($) دولار</option>
                              <option value="SYP">(ل.س) ليرة</option>
                          </select>
                      </div>

                      <div className="p-0 border-l border-gray-200 dark:border-dark-800 relative">
                          <input 
                            type="number"
                            data-row={index}
                            data-field="amount"
                            placeholder="0.00"
                            className="w-full h-full px-3 bg-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-inset focus:ring-primary-500 outline-none text-sm font-bold dark:text-white"
                            value={row.amount}
                            onChange={e => updateRow(row.id, 'amount', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, 'amount')}
                          />
                      </div>

                      <div className="p-0 border-l border-gray-200 dark:border-dark-800">
                          <input 
                            type="text"
                            data-row={index}
                            data-field="description"
                            placeholder="الوصف..."
                            className="w-full h-full px-3 bg-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-inset focus:ring-primary-500 outline-none text-sm dark:text-white"
                            value={row.description}
                            onChange={e => updateRow(row.id, 'description', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, 'description')}
                          />
                      </div>

                      <div className="p-0 border-l border-gray-200 dark:border-dark-800">
                          <select
                            data-row={index}
                            data-field="projectId"
                            className="w-full h-full px-2 bg-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-inset focus:ring-primary-500 outline-none text-sm dark:text-white cursor-pointer text-gray-500 font-medium"
                            value={row.projectId}
                            onChange={e => updateRow(row.id, 'projectId', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, 'projectId')}
                          >
                              <option value="">(عام / بدون مشروع)</option>
                              {activeProjects.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                          </select>
                      </div>

                      <div className="p-0 border-l border-gray-200 dark:border-dark-800">
                          <input 
                            type="text"
                            data-row={index}
                            data-field="fromAccount"
                            list="accounts-list"
                            className="w-full h-full px-2 bg-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-inset focus:ring-primary-500 outline-none text-sm dark:text-white"
                            value={row.fromAccount}
                            onChange={e => updateRow(row.id, 'fromAccount', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, 'fromAccount')}
                          />
                      </div>

                      <div className="p-0 border-l border-gray-200 dark:border-dark-800">
                          <input 
                            type="text"
                            data-row={index}
                            data-field="toAccount"
                            list="accounts-list"
                            className="w-full h-full px-2 bg-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-inset focus:ring-primary-500 outline-none text-sm dark:text-white"
                            value={row.toAccount}
                            onChange={e => updateRow(row.id, 'toAccount', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, 'toAccount')}
                          />
                      </div>

                      <div className="p-0 flex items-center justify-center">
                          <button 
                            tabIndex={-1}
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                              <Trash2 size={14} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
          
          <div className="mt-4 flex justify-center">
              <button 
                onClick={() => addNewRows(5)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-200 dark:bg-dark-800 px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                  <Plus size={16} /> إضافة صفوف جديدة
              </button>
          </div>
      </div>

      <datalist id="accounts-list">
          <option value="الخزينة الرئيسية" />
          <option value="البنك" />
          <option value="العميل" />
          <option value="مصروفات" />
          <option value="رواتب" />
          <option value="مشتريات" />
          <option value="إيجار" />
      </datalist>
    </div>
  );
};

export default AccountantFocusMode;
