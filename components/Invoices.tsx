
import React, { useEffect, useState } from 'react';
import { getRecentInvoices, formatCurrency } from '../services/dataService';
import { Invoice, InvoiceItem, InvoiceType, StatementColumn, User } from '../types';
import { logActivity } from '../services/auditService';
import { Plus, Search, FileText, CheckCircle, ArrowLeft, Trash2, Camera, Percent, PlusSquare, X, Paperclip, Settings, Eye, EyeOff, Edit, Hash } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_INVOICES } from '../constants';
import SearchableSelect from './SearchableSelect';
import Modal from './Modal';

interface InvoicesProps {
    currentUser?: User;
}

const Invoices: React.FC<InvoicesProps> = ({ currentUser }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'create'>('list');

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

  // Local State for Items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // Local State for Custom Columns Management
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  useEffect(() => {
    getRecentInvoices().then(setInvoices);
  }, []);

  // --- Calculation Logic (Supports Decimals) ---
  useEffect(() => {
    // Ensure we handle floating point addition correctly
    const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const discount = Number(currentInvoice.discount) || 0;
    const total = Math.max(0, subtotal - discount);
    
    // Round to 2 decimal places to avoid 3.5000000004 issues
    const fixedSubtotal = Number(subtotal.toFixed(2));
    const fixedTotal = Number(total.toFixed(2));

    setCurrentInvoice(prev => ({
        ...prev,
        subtotal: fixedSubtotal,
        totalAmount: fixedTotal,
        amount: fixedTotal // Keep legacy amount synced
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
              // Auto-calculate row total if quantity or price changes
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

  // --- Dynamic Columns Logic ---
  const handleAddCustomColumn = () => {
      if (!newColumnName.trim()) return;
      const newCol: StatementColumn = {
          id: `col-${Date.now()}`,
          label: newColumnName,
          type: 'text'
      };
      const updatedColumns = [...(currentInvoice.customColumns || []), newCol];
      setCurrentInvoice({ ...currentInvoice, customColumns: updatedColumns });
      setNewColumnName('');
      setIsColumnModalOpen(false);
  };

  const handleRemoveCustomColumn = (colId: string) => {
      const updatedColumns = currentInvoice.customColumns?.filter(c => c.id !== colId) || [];
      setCurrentInvoice({ ...currentInvoice, customColumns: updatedColumns });
  };

  // --- File Handling (Multiple) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          // Convert FileList to array of URLs
          const newFiles = Array.from(e.target.files).map(file => URL.createObjectURL(file as Blob));
          setCurrentInvoice(prev => ({
              ...prev,
              attachments: [...(prev.attachments || []), ...newFiles]
          }));
      }
  };

  const removeAttachment = (index: number) => {
      const updatedAttachments = currentInvoice.attachments?.filter((_, i) => i !== index);
      setCurrentInvoice({ ...currentInvoice, attachments: updatedAttachments });
  };

  // --- Save Logic ---
  const handleSaveInvoice = () => {
      // --- COMPREHENSIVE VALIDATION ---
      const errors: string[] = [];

      if (!currentInvoice.projectId) {
          errors.push("يرجى اختيار المشروع المرتبط بالفاتورة.");
      }
      if (!currentInvoice.supplierName) {
          errors.push("يرجى إدخال اسم المورد.");
      }
      if (items.length === 0) {
          errors.push("يرجى إضافة بند واحد على الأقل للفاتورة.");
      }
      
      // Check for items with zero price or quantity
      const invalidItems = items.filter(i => i.quantity <= 0 || i.unitPrice <= 0);
      if (invalidItems.length > 0) {
          errors.push(`يوجد ${invalidItems.length} بند يحتوي على كمية أو سعر غير صحيح (صفر أو أقل).`);
      }

      if (errors.length > 0) {
          alert("عذراً، لا يمكن حفظ الفاتورة. يرجى تصحيح الأخطاء التالية:\n\n" + errors.map(e => "• " + e).join("\n"));
          return;
      }
      // --------------------------------

      if (currentInvoice.id) {
          // Update existing local state
          setInvoices(invoices.map(inv => inv.id === currentInvoice.id ? { ...inv, ...currentInvoice, items } as Invoice : inv));
          
          // CRITICAL: Update Global Mock so Client Portal sees changes immediately
          const mockIndex = MOCK_INVOICES.findIndex(i => i.id === currentInvoice.id);
          if (mockIndex !== -1) {
              MOCK_INVOICES[mockIndex] = { ...MOCK_INVOICES[mockIndex], ...currentInvoice, items } as Invoice;
          }
          if (currentUser) {
              logActivity(currentUser, 'UPDATE', 'Invoice', `تعديل الفاتورة رقم ${currentInvoice.invoiceNumber}`, currentInvoice.id);
          }

      } else {
          // Create New
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
              amount: currentInvoice.totalAmount || 0, // Legacy
              status: 'Pending',
              type: InvoiceType.PURCHASE,
              category: 'مشتريات',
              attachments: currentInvoice.attachments || [],
              customColumns: currentInvoice.customColumns || [],
              isClientVisible: currentInvoice.isClientVisible || false
          };
          setInvoices([newInv, ...invoices]);
          
          // CRITICAL: Push to Global Mock
          MOCK_INVOICES.unshift(newInv);
          
          if (currentUser) {
              logActivity(currentUser, 'CREATE', 'Invoice', `إنشاء فاتورة جديدة برقم ${newInv.invoiceNumber} للمورد ${newInv.supplierName}`, newInv.id);
          }
      }

      setView('list');
      resetForm();
  };

  const handleEditInvoice = (inv: Invoice) => {
      setCurrentInvoice(inv);
      setItems(inv.items || []);
      setView('create');
  };

  const toggleClientVisibility = (invoiceId: string) => {
      // 1. Update Local State
      setInvoices(invoices.map(inv => 
          inv.id === invoiceId ? { ...inv, isClientVisible: !inv.isClientVisible } : inv
      ));

      // 2. CRITICAL: Update Global Data (so Client Portal sees it)
      const mockIndex = MOCK_INVOICES.findIndex(inv => inv.id === invoiceId);
      if (mockIndex !== -1) {
          MOCK_INVOICES[mockIndex].isClientVisible = !MOCK_INVOICES[mockIndex].isClientVisible;
      }
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

  // --- Filtering ---
  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.systemSerial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const projectOptions = MOCK_PROJECTS.map(p => ({ value: p.id, label: p.name }));

  // --- View: List ---
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

            {/* Search */}
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

            {/* Invoices List */}
            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 font-bold">
                            <tr>
                                <th className="px-6 py-4">رقم الفاتورة</th>
                                <th className="px-6 py-4">المرجع (النظام)</th>
                                <th className="px-6 py-4">المورد</th>
                                <th className="px-6 py-4">المشروع</th>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">البنود</th>
                                <th className="px-6 py-4">الإجمالي</th>
                                <th className="px-6 py-4">عرض للعميل</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-700 dark:text-gray-300">
                                        {inv.invoiceNumber}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                        {inv.systemSerial ? (
                                            <span className="bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded border border-gray-200 dark:border-dark-600 flex items-center gap-1 w-fit">
                                                <Hash size={10} /> {inv.systemSerial}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">{inv.supplierName}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 dark:bg-dark-800 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400">
                                            {MOCK_PROJECTS.find(p => p.id === inv.projectId)?.name || inv.projectId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{inv.date}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {inv.items?.length === 0 ? (
                                            <span className="text-red-500 font-bold text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded animate-pulse">فارغة - تحتاج إدخال</span>
                                        ) : inv.items?.length}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-primary-700 dark:text-primary-400">{formatCurrency(inv.totalAmount)}</td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => toggleClientVisibility(inv.id)}
                                            className={`p-2 rounded-full transition-colors ${inv.isClientVisible ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}
                                            title={inv.isClientVisible ? "ظاهرة للعميل" : "مخفية عن العميل"}
                                        >
                                            {inv.isClientVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {inv.items.length === 0 && (
                                                <button 
                                                    onClick={() => handleEditInvoice(inv)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1"
                                                >
                                                    <Edit size={12} /> تعبئة البنود
                                                </button>
                                            )}
                                            {inv.attachmentUrl || (inv.attachments && inv.attachments.length > 0) ? (
                                                <button 
                                                  onClick={() => window.open(inv.attachmentUrl || (inv.attachments ? inv.attachments[0] : ''), '_blank')}
                                                  className="text-gray-500 hover:text-primary-600 p-2" 
                                                  title="عرض المرفق"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleEditInvoice(inv)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2" title="إرفاق ملف"><Paperclip size={18} /></button>
                                            )}
                                            
                                            {inv.items.length > 0 && (
                                                <button 
                                                    onClick={() => handleEditInvoice(inv)}
                                                    className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-2"
                                                    title="تعديل"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400 dark:text-gray-600">لا توجد فواتير مسجلة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  // --- View: Create Invoice ---
  return (
      <div className="bg-white dark:bg-dark-900 min-h-screen rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-800/50">
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('list')}
                    className="p-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                  >
                      <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                  </button>
                  <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                          {currentInvoice.id ? 'تعديل الفاتورة' : 'إنشاء فاتورة مشتريات جديدة'}
                      </h2>
                      {currentInvoice.systemSerial && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono mt-1 inline-block">
                              مرتبط بالحركة المالية: {currentInvoice.systemSerial}
                          </span>
                      )}
                  </div>
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={() => setView('list')}
                    className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                  >
                      إلغاء
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveInvoice}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-primary-500/20 flex items-center gap-2"
                  >
                      <CheckCircle size={18} />
                      حفظ الفاتورة
                  </button>
              </div>
          </div>

          <div className="p-8 max-w-6xl mx-auto space-y-8">
              
              {/* Step 1: Multiple Uploads */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center transition-colors">
                  <div className="relative group cursor-pointer inline-block mb-4">
                      <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" onChange={handleFileUpload} accept="image/*,.pdf" />
                      <div className="flex flex-col items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900 group-hover:border-blue-400 transition-colors">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                              <Camera size={24} />
                          </div>
                          <span className="font-bold text-blue-700 dark:text-blue-300">إضافة صور أو ملفات PDF</span>
                          <span className="text-xs text-blue-500">يمكنك اختيار أكثر من ملف</span>
                      </div>
                  </div>

                  {/* Attachments Preview Grid */}
                  {currentInvoice.attachments && currentInvoice.attachments.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
                          {currentInvoice.attachments.map((url, idx) => (
                              <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-300 dark:border-dark-600 shadow-sm bg-white dark:bg-dark-800">
                                  <img src={url} alt={`att-${idx}`} className="w-full h-full object-cover" />
                                  <button 
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  >
                                      <X size={12} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Step 2: Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">رقم الفاتورة (المرجعي)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
                        placeholder="مثال: INV-001"
                        value={currentInvoice.invoiceNumber}
                        onChange={(e) => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ الفاتورة</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
                        value={currentInvoice.date}
                        onChange={(e) => setCurrentInvoice({...currentInvoice, date: e.target.value})}
                      />
                  </div>
                  <div>
                      <SearchableSelect 
                          label="المشروع"
                          placeholder="اختر المشروع..."
                          options={projectOptions}
                          value={currentInvoice.projectId || ''}
                          onChange={(val) => setCurrentInvoice({...currentInvoice, projectId: val})}
                          required
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المورد / البائع</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
                        placeholder="اسم المحل أو الشركة"
                        value={currentInvoice.supplierName}
                        onChange={(e) => setCurrentInvoice({...currentInvoice, supplierName: e.target.value})}
                      />
                  </div>
              </div>

              {/* Step 3: Items Table with Dynamic Columns */}
              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                  <div className="p-4 bg-gray-100 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <FileText size={18} /> بنود الفاتورة
                      </h3>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setIsColumnModalOpen(true)}
                            className="bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-dark-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                          >
                              <Settings size={14} /> إضافة أعمدة
                          </button>
                          <button 
                            onClick={handleAddItem}
                            className="text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                          >
                              <Plus size={16} /> إضافة بند جديد
                          </button>
                      </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-right min-w-[800px]">
                          <thead className="bg-white dark:bg-dark-900 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold border-b dark:border-dark-700">
                              <tr>
                                  <th className="px-4 py-3 w-10 text-center">#</th>
                                  <th className="px-4 py-3">وصف المادة / الخدمة</th>
                                  {/* Dynamic Columns Headers */}
                                  {currentInvoice.customColumns?.map(col => (
                                      <th key={col.id} className="px-4 py-3 w-32 relative group">
                                          {col.label}
                                          <button 
                                            onClick={() => handleRemoveCustomColumn(col.id)}
                                            className="absolute top-1/2 left-1 -translate-y-1/2 text-red-400 opacity-0 group-hover:opacity-100"
                                            title="حذف العمود"
                                          >
                                              <X size={12} />
                                          </button>
                                      </th>
                                  ))}
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
                                      <td className="px-4 py-2">
                                          <input 
                                            type="text" 
                                            className="w-full bg-transparent border-b border-transparent focus:border-primary-500 outline-none py-1 text-gray-800 dark:text-white placeholder-gray-300"
                                            placeholder="اسم المادة..."
                                            value={item.description}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                          />
                                      </td>
                                      
                                      {/* Dynamic Columns Inputs */}
                                      {currentInvoice.customColumns?.map(col => (
                                          <td key={col.id} className="px-4 py-2">
                                              <input 
                                                type={col.type === 'number' ? 'number' : 'text'}
                                                className="w-full bg-transparent border-b border-transparent focus:border-primary-500 outline-none py-1 text-gray-700 dark:text-gray-300 text-sm"
                                                value={item[col.id] || ''}
                                                onChange={(e) => handleItemChange(item.id, col.id, e.target.value)}
                                              />
                                          </td>
                                      ))}

                                      <td className="px-4 py-2">
                                          <input 
                                            type="text" 
                                            className="w-full bg-transparent border-b border-transparent focus:border-primary-500 outline-none py-1 text-gray-600 dark:text-gray-300 text-center"
                                            value={item.unit}
                                            onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                          />
                                      </td>
                                      <td className="px-4 py-2">
                                          <input 
                                            type="number" 
                                            step="0.01" // Support decimals
                                            className="w-full bg-gray-50 dark:bg-dark-800 border dark:border-dark-700 rounded px-2 py-1 text-center font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                          />
                                      </td>
                                      <td className="px-4 py-2">
                                          <input 
                                            type="number" 
                                            step="0.01" // Support decimals
                                            className="w-full bg-gray-50 dark:bg-dark-800 border dark:border-dark-700 rounded px-2 py-1 text-center font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                          />
                                      </td>
                                      <td className="px-4 py-2 font-bold text-primary-700 dark:text-primary-400">
                                          {formatCurrency(item.total)}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                          <button 
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {items.length === 0 && (
                                  <tr>
                                      <td colSpan={7 + (currentInvoice.customColumns?.length || 0)} className="text-center py-8 text-gray-400">
                                          اضغط على "إضافة بند جديد" للبدء
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Step 4: Summary & Discount */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  {/* Visibility Toggle */}
                  <div className="bg-gray-100 dark:bg-dark-800 p-4 rounded-xl flex items-center gap-4">
                      <div className={`p-2 rounded-full ${currentInvoice.isClientVisible ? 'bg-green-100 text-green-600' : 'bg-gray-200 dark:bg-dark-600 text-gray-500'}`}>
                          {currentInvoice.isClientVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                      </div>
                      <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4"
                                checked={currentInvoice.isClientVisible}
                                onChange={(e) => setCurrentInvoice({...currentInvoice, isClientVisible: e.target.checked})}
                              />
                              <span className="font-bold text-sm text-gray-700 dark:text-gray-300">إظهار الفاتورة للعميل</span>
                          </label>
                          <p className="text-xs text-gray-500 mt-1">عند التفعيل، ستظهر هذه الفاتورة في بوابة العميل.</p>
                      </div>
                  </div>

                  <div className="w-full md:w-1/3 bg-gray-50 dark:bg-dark-800 rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-dark-700">
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                          <span>المجموع الأولي</span>
                          <span className="font-bold text-lg">{formatCurrency(currentInvoice.subtotal || 0)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-red-500">
                          <span className="flex items-center gap-1"><Percent size={16} /> حسم (خصم)</span>
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-24 bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900 rounded px-2 py-1 text-center font-bold text-red-600 focus:outline-none focus:border-red-500"
                            value={currentInvoice.discount}
                            onChange={(e) => setCurrentInvoice({...currentInvoice, discount: Number(e.target.value)})}
                          />
                      </div>

                      <div className="border-t border-gray-200 dark:border-dark-600 pt-4 flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-800 dark:text-white">المجموع النهائي</span>
                          <span className="text-2xl font-extrabold text-primary-700 dark:text-primary-400">{formatCurrency(currentInvoice.totalAmount || 0)}</span>
                      </div>
                  </div>
              </div>

          </div>

          {/* Add Column Modal */}
          <Modal isOpen={isColumnModalOpen} onClose={() => setIsColumnModalOpen(false)} title="إضافة عمود جديد للفاتورة">
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">اسم العمود</label>
                      <input 
                        type="text" 
                        placeholder="مثال: اللون، المصدر، ملاحظات..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white dark:border-dark-700"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        autoFocus
                      />
                  </div>
                  <button 
                    onClick={handleAddCustomColumn}
                    className="w-full bg-primary-600 text-white font-bold py-2.5 rounded-lg hover:bg-primary-700"
                  >
                      إضافة
                  </button>
              </div>
          </Modal>
      </div>
  );
};

export default Invoices;
