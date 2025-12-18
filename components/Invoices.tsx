
import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../services/dataService';
import { Invoice, InvoiceItem, InvoiceType, StatementColumn, User, Project, ActivityLog } from '../types';
import { Plus, Search, FileText, CheckCircle, ArrowLeft, Trash2, Camera, Percent, X, Paperclip, Settings, Eye, EyeOff, Edit, Hash, Printer } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import Modal from './Modal';
import DocumentPreview from './DocumentPreview';

interface InvoicesProps {
    invoices: Invoice[];
    onUpdateInvoices: (invoices: Invoice[]) => void;
    projects: Project[];
    currentUser?: User;
    onAction?: (action: ActivityLog['action'], entity: ActivityLog['entity'], description: string, entityId?: string) => void;
}

const Invoices: React.FC<InvoicesProps> = ({ invoices, onUpdateInvoices, projects, currentUser, onAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'create'>('list');

  // Print State
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);

  // Creation State
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    supplierName: '',
    items: [],
    subtotal: 0,
    discount: 0,
    totalAmount: 0,
    attachments: [],
    customColumns: [],
    isClientVisible: false, // Default hidden
    systemSerial: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // Local State for Custom Columns Management
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  // --- Calculation Logic ---
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const discount = Number(currentInvoice.discount) || 0;
    const total = Math.max(0, subtotal - discount);
    
    const fixedSubtotal = Number(subtotal.toFixed(2));
    const fixedTotal = Number(total.toFixed(2));

    setCurrentInvoice(prev => ({
        ...prev,
        subtotal: fixedSubtotal,
        totalAmount: fixedTotal,
        amount: fixedTotal
    }));
  }, [items, currentInvoice.discount]);

  const handleAddItem = () => {
      const newItem: InvoiceItem = {
          id: `item-${Date.now()}`,
          description: '',
          unit: 'عدد',
          quantity: 1,
          unitPrice: 0,
          total: 0
      };
      setItems([...items, newItem]);
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem | string, value: any) => {
      const updatedItems = items.map(item => {
          if (item.id === id) {
              const updatedItem = { ...item, [field]: value };
              if (field === 'quantity' || field === 'unitPrice') {
                  const q = Number(updatedItem.quantity) || 0;
                  const p = Number(updatedItem.unitPrice) || 0;
                  updatedItem.total = Number((q * p).toFixed(2));
              }
              return updatedItem;
          }
          return item;
      });
      setItems(updatedItems);
  };

  const handleRemoveItem = (id: string) => {
      setItems(items.filter(i => i.id !== id));
  };

  const handleSaveInvoice = () => {
      const errors: string[] = [];
      if (!currentInvoice.projectId) errors.push("يرجى اختيار المشروع المرتبط بالفاتورة.");
      if (!currentInvoice.supplierName) errors.push("يرجى إدخال اسم المورد.");
      if (items.length === 0) errors.push("يرجى إضافة بند واحد على الأقل للفاتورة.");
      
      if (errors.length > 0) {
          alert("عذراً، لا يمكن حفظ الفاتورة. يرجى تصحيح الأخطاء التالية:\n\n" + errors.map(e => "• " + e).join("\n"));
          return;
      }

      if (currentInvoice.id) {
          onUpdateInvoices(invoices.map(inv => inv.id === currentInvoice.id ? { ...inv, ...currentInvoice, items } as Invoice : inv));
          if (onAction) onAction('UPDATE', 'Invoice', `تعديل الفاتورة رقم ${currentInvoice.invoiceNumber}`, currentInvoice.id);
      } else {
          const newInv: Invoice = {
              id: `inv-${Date.now()}`,
              invoiceNumber: currentInvoice.invoiceNumber || `INV-${Date.now()}`,
              systemSerial: currentInvoice.systemSerial,
              date: currentInvoice.date || new Date().toISOString().split('T')[0],
              projectId: currentInvoice.projectId || '',
              supplierName: currentInvoice.supplierName || '',
              items: items,
              subtotal: currentInvoice.subtotal || 0,
              discount: currentInvoice.discount || 0,
              totalAmount: currentInvoice.totalAmount || 0,
              amount: currentInvoice.totalAmount || 0,
              status: 'Pending',
              type: InvoiceType.PURCHASE,
              category: 'مشتريات',
              attachments: currentInvoice.attachments || [],
              customColumns: currentInvoice.customColumns || [],
              isClientVisible: currentInvoice.isClientVisible || false
          };
          onUpdateInvoices([newInv, ...invoices]);
          if (onAction) onAction('CREATE', 'Invoice', `إنشاء فاتورة جديدة برقم ${newInv.invoiceNumber} للمورد ${newInv.supplierName}`, newInv.id);
      }

      setView('list');
      resetForm();
  };

  const handleEditInvoice = (inv: Invoice) => {
      setCurrentInvoice(inv);
      setItems(inv.items || []);
      setView('create');
  };

  const handlePrintInvoice = (inv: Invoice) => {
      setInvoiceToPrint(inv);
      setPrintPreviewOpen(true);
  };

  const toggleClientVisibility = (invoiceId: string) => {
      onUpdateInvoices(invoices.map(inv => 
          inv.id === invoiceId ? { ...inv, isClientVisible: !inv.isClientVisible } : inv
      ));
  };

  const resetForm = () => {
      setCurrentInvoice({
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        projectId: '',
        supplierName: '',
        items: [],
        subtotal: 0,
        discount: 0,
        totalAmount: 0,
        attachments: [],
        customColumns: [],
        isClientVisible: false,
        systemSerial: ''
      });
      setItems([]);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const projectOptions = projects.map(p => ({ value: p.id, label: p.name }));

  if (view === 'list') {
      return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة فواتير المشتريات</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">سجل مشتريات المواد والمصاريف الخاصة بالمشاريع</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setView('create'); }}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30"
                >
                    <Plus size={20} />
                    <span>تسجيل فاتورة شراء جديدة</span>
                </button>
            </div>

            <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                <div className="relative max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text"
                        placeholder="بحث برقم الفاتورة، الرقم التسلسلي، أو المورد..."
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 font-bold">
                            <tr>
                                <th className="px-6 py-4">رقم الفاتورة</th>
                                <th className="px-6 py-4">المورد</th>
                                <th className="px-6 py-4">المشروع</th>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">الإجمالي</th>
                                <th className="px-6 py-4">عرض للعميل</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-700 dark:text-gray-300">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">{inv.supplierName}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 dark:bg-dark-800 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400">
                                            {projects.find(p => p.id === inv.projectId)?.name || inv.projectId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{inv.date}</td>
                                    <td className="px-6 py-4 font-bold text-primary-700 dark:text-primary-400">{formatCurrency(inv.totalAmount)}</td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => toggleClientVisibility(inv.id)}
                                            className={`p-2 rounded-full transition-colors ${inv.isClientVisible ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}
                                        >
                                            {inv.isClientVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handlePrintInvoice(inv)}
                                                className="text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 p-2"
                                                title="طباعة رسمية"
                                            >
                                                <Printer size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleEditInvoice(inv)}
                                                className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-2"
                                                title="تعديل"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-600">لا توجد فواتير مسجلة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Smart Print Component */}
            <DocumentPreview 
                isOpen={printPreviewOpen} 
                onClose={() => setPrintPreviewOpen(false)} 
                type="invoice" 
                data={invoiceToPrint} 
                project={projects.find(p => p.id === invoiceToPrint?.projectId)}
            />
        </div>
      );
  }

  // --- View: Create Invoice ---
  return (
      <div className="bg-white dark:bg-dark-900 min-h-screen rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 animate-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-800/50">
              <div className="flex items-center gap-4">
                  <button onClick={() => setView('list')} className="p-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
                      <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                  </button>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{currentInvoice.id ? 'تعديل الفاتورة' : 'إنشاء فاتورة مشتريات جديدة'}</h2>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setView('list')} className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700">إلغاء</button>
                  <button type="button" onClick={handleSaveInvoice} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg flex items-center gap-2">
                      <CheckCircle size={18} /> حفظ الفاتورة
                  </button>
              </div>
          </div>

          <div className="p-8 max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">رقم الفاتورة (المرجعي)</label>
                      <input type="text" className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-xl outline-none dark:bg-dark-950 dark:text-white" placeholder="مثال: INV-001" value={currentInvoice.invoiceNumber} onChange={(e) => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ الفاتورة</label>
                      <input type="date" className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-xl outline-none dark:bg-dark-950 dark:text-white" value={currentInvoice.date} onChange={(e) => setCurrentInvoice({...currentInvoice, date: e.target.value})} />
                  </div>
                  <div>
                      <SearchableSelect label="المشروع" placeholder="اختر المشروع..." options={projectOptions} value={currentInvoice.projectId || ''} onChange={(val) => setCurrentInvoice({...currentInvoice, projectId: val})} required />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المورد / البائع</label>
                      <input type="text" className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-xl outline-none dark:bg-dark-950 dark:text-white" placeholder="اسم المحل أو الشركة" value={currentInvoice.supplierName} onChange={(e) => setCurrentInvoice({...currentInvoice, supplierName: e.target.value})} />
                  </div>
              </div>

              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                  <div className="p-4 bg-gray-100 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><FileText size={18} /> بنود الفاتورة</h3>
                      <button onClick={handleAddItem} className="text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"><Plus size={16} /> إضافة بند جديد</button>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-right min-w-[800px]">
                          <thead className="bg-white dark:bg-dark-900 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold border-b dark:border-dark-700">
                              <tr>
                                  <th className="px-4 py-3 w-10 text-center">#</th>
                                  <th className="px-4 py-3">وصف المادة / الخدمة</th>
                                  <th className="px-4 py-3 w-24">الوحدة</th>
                                  <th className="px-4 py-3 w-24">الكمية</th>
                                  <th className="px-4 py-3 w-32">السعر الإفرادي</th>
                                  <th className="px-4 py-3 w-32">الإجمالي</th>
                                  <th className="px-4 py-3 w-10"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                              {items.map((item, index) => (
                                  <tr key={item.id} className="bg-white dark:bg-dark-900 group">
                                      <td className="px-4 py-2 text-center text-gray-400 font-mono">{index + 1}</td>
                                      <td className="px-4 py-2"><input type="text" className="w-full bg-transparent border-b border-transparent focus:border-primary-500 outline-none py-1 text-gray-800 dark:text-white placeholder-gray-300" placeholder="اسم المادة..." value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} /></td>
                                      <td className="px-4 py-2"><input type="text" className="w-full bg-transparent border-b border-transparent focus:border-primary-500 outline-none py-1 text-gray-600 dark:text-gray-300 text-center" value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)} /></td>
                                      <td className="px-4 py-2"><input type="number" step="0.01" className="w-full bg-gray-50 dark:bg-dark-800 border dark:border-dark-700 rounded px-2 py-1 text-center font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} /></td>
                                      <td className="px-4 py-2"><input type="number" step="0.01" className="w-full bg-gray-50 dark:bg-dark-800 border dark:border-dark-700 rounded px-2 py-1 text-center font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} /></td>
                                      <td className="px-4 py-2 font-bold text-primary-700 dark:text-primary-400">{formatCurrency(item.total)}</td>
                                      <td className="px-4 py-2 text-center"><button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1.5"><Trash2 size={16} /></button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="bg-gray-100 dark:bg-dark-800 p-4 rounded-xl flex items-center gap-4">
                      <div className={`p-2 rounded-full ${currentInvoice.isClientVisible ? 'bg-green-100 text-green-600' : 'bg-gray-200 dark:bg-dark-600 text-gray-500'}`}>
                          {currentInvoice.isClientVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                      </div>
                      <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4" checked={currentInvoice.isClientVisible} onChange={(e) => setCurrentInvoice({...currentInvoice, isClientVisible: e.target.checked})} />
                              <span className="font-bold text-sm text-gray-700 dark:text-gray-300">إظهار الفاتورة للعميل</span>
                          </label>
                      </div>
                  </div>

                  <div className="w-full md:w-1/3 bg-gray-50 dark:bg-dark-800 rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-dark-700">
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400"><span>المجموع الأولي</span><span className="font-bold text-lg">{formatCurrency(currentInvoice.subtotal || 0)}</span></div>
                      <div className="flex justify-between items-center text-red-500"><span className="flex items-center gap-1"><Percent size={16} /> حسم (خصم)</span><input type="number" step="0.01" className="w-24 bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900 rounded px-2 py-1 text-center font-bold text-red-600 outline-none" value={currentInvoice.discount} onChange={(e) => setCurrentInvoice({...currentInvoice, discount: Number(e.target.value)})} /></div>
                      <div className="border-t border-gray-200 dark:border-dark-600 pt-4 flex justify-between items-center"><span className="text-xl font-bold text-gray-800 dark:text-white">المجموع النهائي</span><span className="text-2xl font-extrabold text-primary-700 dark:text-primary-400">{formatCurrency(currentInvoice.totalAmount || 0)}</span></div>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default Invoices;
