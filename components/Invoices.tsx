
import React, { useEffect, useState } from 'react';
import { getRecentInvoices, formatCurrency } from '../services/dataService';
import { Invoice, InvoiceType } from '../types';
import { Plus, Search, Filter, Download, FileText, CheckCircle, Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Modal from './Modal';
import { MOCK_PROJECTS, MOCK_CLIENTS } from '../constants';
import SearchableSelect from './SearchableSelect';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    amount: 0,
    type: InvoiceType.SALES,
    category: '',
    supplierOrClient: ''
  });

  useEffect(() => {
    getRecentInvoices().then(setInvoices);
  }, []);

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      projectId: newInvoice.projectId || 'New',
      amount: newInvoice.amount || 0,
      type: newInvoice.type as InvoiceType,
      category: newInvoice.category || 'عام',
      status: 'Pending',
      supplierOrClient: newInvoice.supplierOrClient || 'غير محدد'
    };

    setInvoices([invoice, ...invoices]);
    setIsModalOpen(false);
    setNewInvoice({ amount: 0, type: InvoiceType.SALES, category: '', supplierOrClient: '' });
  };

  const handleExport = () => {
    alert("سيتم تحميل ملف Excel للفواتير المختارة...");
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.supplierOrClient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.category.includes(searchTerm);
    
    const matchesType = filterType === 'all' || 
      (filterType === 'sales' && inv.type === InvoiceType.SALES) ||
      (filterType === 'purchase' && (inv.type === InvoiceType.PURCHASE || inv.type === InvoiceType.SUPPLIER));

    return matchesSearch && matchesType;
  });

  const totalSales = invoices
    .filter(i => i.type === InvoiceType.SALES)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPurchases = invoices
    .filter(i => i.type === InvoiceType.PURCHASE || i.type === InvoiceType.SUPPLIER)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Options for SearchableSelects
  const projectOptions = MOCK_PROJECTS.map(p => ({ value: p.id, label: p.name }));
  const clientOptions = MOCK_CLIENTS.map(c => ({ value: c.name, label: c.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة الفواتير</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">متابعة فواتير المبيعات، المشتريات، والموردين</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">تصدير التقرير</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>فاتورة جديدة</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي المبيعات</p>
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(totalSales)}</h3>
           </div>
           <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
             <ArrowDownLeft className="w-6 h-6 text-green-600 dark:text-green-400" />
           </div>
        </div>
        <div className="bg-white dark:bg-dark-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي المشتريات</p>
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(totalPurchases)}</h3>
           </div>
           {/* Blue for Purchases */}
           <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
             <ArrowUpRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
           </div>
        </div>
        <div className="bg-white dark:bg-dark-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">فواتير معلقة</p>
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{invoices.filter(i => i.status === 'Pending').length}</h3>
           </div>
           <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full">
             <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
           </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث برقم الفاتورة، المورد، أو التصنيف..."
            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-lg w-full md:w-auto">
            <button 
              onClick={() => setFilterType('all')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm rounded-md transition-all ${filterType === 'all' ? 'bg-white dark:bg-dark-700 text-gray-800 dark:text-white shadow-sm font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              الكل
            </button>
            <button 
              onClick={() => setFilterType('sales')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm rounded-md transition-all ${filterType === 'sales' ? 'bg-white dark:bg-dark-700 text-gray-800 dark:text-white shadow-sm font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              مبيعات
            </button>
            <button 
              onClick={() => setFilterType('purchase')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm rounded-md transition-all ${filterType === 'purchase' ? 'bg-white dark:bg-dark-700 text-gray-800 dark:text-white shadow-sm font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              مشتريات
            </button>
          </div>
          <button className="p-2.5 border border-gray-300 dark:border-dark-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الفاتورة</th>
                <th className="px-6 py-4 font-medium">الطرف (عميل/مورد)</th>
                <th className="px-6 py-4 font-medium">نوع الفاتورة</th>
                <th className="px-6 py-4 font-medium">المشروع</th>
                <th className="px-6 py-4 font-medium">المبلغ</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-dark-800 rounded-lg text-gray-500 dark:text-gray-400">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-200">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{inv.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                    {inv.supplierOrClient || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {/* Purchase/Supplier = Blue, Sales = Green */}
                      <span className={`text-xs font-bold ${
                        inv.type === InvoiceType.SALES ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {inv.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{inv.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    <span className="bg-gray-100 dark:bg-dark-800 px-2 py-1 rounded text-xs">
                      #{inv.projectId}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{formatCurrency(inv.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      inv.status === 'Paid' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 
                      inv.status === 'Overdue' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 
                      'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                    }`}>
                      {inv.status === 'Paid' ? <CheckCircle size={12} /> : 
                       inv.status === 'Overdue' ? <AlertTriangle size={12} /> : 
                       <Clock size={12} />}
                      {inv.status === 'Paid' ? 'مدفوع' : inv.status === 'Overdue' ? 'متأخر' : 'معلق'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium text-xs">
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    لا توجد فواتير مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* New Invoice Modal */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة فاتورة جديدة">
        <form onSubmit={handleAddInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الفاتورة</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`py-2 rounded-lg border text-sm font-bold transition-colors ${newInvoice.type === InvoiceType.SALES ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' : 'border-gray-300 dark:border-dark-700 text-gray-600 dark:text-gray-400'}`}
                onClick={() => setNewInvoice({...newInvoice, type: InvoiceType.SALES})}
              >
                مبيعات (عميل)
              </button>
              <button
                type="button"
                className={`py-2 rounded-lg border text-sm font-bold transition-colors ${newInvoice.type === InvoiceType.PURCHASE ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' : 'border-gray-300 dark:border-dark-700 text-gray-600 dark:text-gray-400'}`}
                onClick={() => setNewInvoice({...newInvoice, type: InvoiceType.PURCHASE})}
              >
                مشتريات (مصروف)
              </button>
            </div>
          </div>

          <div>
            {newInvoice.type === InvoiceType.SALES ? (
                <SearchableSelect 
                    label="اسم العميل"
                    options={clientOptions}
                    value={newInvoice.supplierOrClient || ''}
                    onChange={(val) => setNewInvoice({...newInvoice, supplierOrClient: val})}
                    required
                    placeholder="ابحث عن العميل..."
                />
            ) : (
                <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المورد / الجهة</label>
                    <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newInvoice.supplierOrClient}
                    onChange={(e) => setNewInvoice({...newInvoice, supplierOrClient: e.target.value})}
                    placeholder="مثال: شركة الحديد، مكتبة النور..."
                    />
                </>
            )}
          </div>

          <div>
             <SearchableSelect 
                label="المشروع المرتبط"
                options={projectOptions}
                value={newInvoice.projectId || ''}
                onChange={(val) => setNewInvoice({...newInvoice, projectId: val})}
                placeholder="ابحث عن المشروع..."
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
            <input 
              required
              type="number" 
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={newInvoice.amount}
              onChange={(e) => setNewInvoice({...newInvoice, amount: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التصنيف / البيان</label>
            <input 
              required
              type="text" 
              placeholder="مثال: دفعة أولى، شراء حديد، صيانة..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={newInvoice.category}
              onChange={(e) => setNewInvoice({...newInvoice, category: e.target.value})}
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              حفظ الفاتورة
            </button>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
