
import React from 'react';
import { Invoice, Project, Transaction } from '../types';
import { formatCurrency } from '../services/dataService';
import { X, Printer, PenTool, Phone, Mail, MapPin } from 'lucide-react';
import { LOGO_URL } from '../constants';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'invoice' | 'receipt' | 'report';
  data: any;
  project?: Project;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ isOpen, onClose, type, data, project }) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-mode');
    window.print();
    // Use timeout to remove class after print dialog interaction, 
    // though print is blocking in many browsers, this is a safety measure.
    // Better listener: 'afterprint' event.
    const cleanup = () => {
      document.body.classList.remove('printing-mode');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
  };

  // --- TEMPLATES ---

  const renderHeader = (title: string) => (
    <div className="flex justify-between items-center border-b-2 border-gray-800 pb-6 mb-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center">
                    <PenTool className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">وكالة نوح</h1>
                    <p className="text-xs text-gray-600 font-bold tracking-widest uppercase">للعمارة والتصميم</p>
                </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center gap-2"><MapPin size={12}/> الرياض، المملكة العربية السعودية</p>
                <p className="flex items-center gap-2"><Phone size={12}/> +966 55 555 5555</p>
            </div>
        </div>
        <div className="text-left">
            <h2 className="text-4xl font-bold text-gray-200 uppercase">{title}</h2>
            <p className="text-gray-500 font-mono mt-2">Date: {new Date().toLocaleDateString('en-GB')}</p>
            {type === 'invoice' && <p className="text-gray-800 font-bold font-mono mt-1">NO: {data.invoiceNumber}</p>}
        </div>
    </div>
  );

  const renderFooter = () => (
    <div className="mt-auto pt-8 border-t border-gray-200">
        <div className="flex justify-between items-end">
            <div className="text-xs text-gray-400 w-1/2">
                <p>ملاحظات:</p>
                <p>- هذه الوثيقة رسمية ومعتمدة من النظام.</p>
                <p>- يرجى الاحتفاظ بها للمراجعة المالية.</p>
            </div>
            <div className="text-center w-1/4">
                <div className="h-16 border-b border-dashed border-gray-400 mb-2"></div>
                <p className="font-bold text-gray-600 text-sm">التوقيع والختم</p>
            </div>
        </div>
        <div className="text-center mt-8 text-[10px] text-gray-300">
            تم إصدار هذا المستند عبر نظام "بناء" المالي الرقمي
        </div>
    </div>
  );

  const renderInvoiceContent = (invoice: Invoice) => (
    <div className="flex-1 flex flex-col">
        {renderHeader('INVOICE')}
        
        <div className="flex justify-between mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">فاتورة إلى (المشروع)</p>
                <p className="font-bold text-lg text-gray-800">{project?.name || invoice.projectId}</p>
                <p className="text-sm text-gray-600">{project?.clientName}</p>
            </div>
            <div className="text-left">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">المورد / الجهة</p>
                <p className="font-bold text-lg text-gray-800">{invoice.supplierName}</p>
                <p className="text-sm text-gray-600">{invoice.category}</p>
            </div>
        </div>

        <table className="w-full text-right mb-8">
            <thead className="bg-gray-800 text-white">
                <tr>
                    <th className="py-3 px-4 text-sm font-bold w-12 text-center">#</th>
                    <th className="py-3 px-4 text-sm font-bold">الوصف</th>
                    <th className="py-3 px-4 text-sm font-bold w-24">الكمية</th>
                    <th className="py-3 px-4 text-sm font-bold w-32">السعر</th>
                    <th className="py-3 px-4 text-sm font-bold w-32">الإجمالي</th>
                </tr>
            </thead>
            <tbody className="text-gray-700">
                {invoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                        <td className="py-3 px-4 text-center text-sm">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium">{item.description}</td>
                        <td className="py-3 px-4">{item.quantity} {item.unit}</td>
                        <td className="py-3 px-4">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-4 font-bold">{formatCurrency(item.total)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="flex justify-end mb-12">
            <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                        <span>الخصم:</span>
                        <span>-{formatCurrency(invoice.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-800 pt-2">
                    <span>الإجمالي المستحق:</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
            </div>
        </div>

        {renderFooter()}
    </div>
  );

  const renderReceiptContent = (txn: Transaction) => (
    <div className="flex-1 flex flex-col">
        {renderHeader(txn.type === 'سند قبض' ? 'RECEIPT' : 'PAYMENT VOUCHER')}
        
        <div className="border-2 border-gray-800 rounded-xl p-8 mb-8 relative">
            <div className="absolute -top-4 right-8 bg-white px-4">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">المبلغ</span>
            </div>
            <div className="text-center">
                <h3 className="text-5xl font-extrabold text-gray-900">{formatCurrency(txn.amount, txn.currency as any)}</h3>
            </div>
        </div>

        <div className="space-y-6 text-lg">
            <div className="flex border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-500 w-32">وذلك عن:</span>
                <span className="font-medium text-gray-900 flex-1">{txn.description}</span>
            </div>
            <div className="flex border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-500 w-32">المشروع:</span>
                <span className="font-medium text-gray-900 flex-1">{project?.name || txn.projectId || 'عام'}</span>
            </div>
            <div className="flex border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-500 w-32">الطرف الثاني:</span>
                <span className="font-medium text-gray-900 flex-1">{txn.recipientName || txn.toAccount}</span>
            </div>
            <div className="flex border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-500 w-32">طريقة الدفع:</span>
                <span className="font-medium text-gray-900 flex-1">نقداً / تحويل (من حساب: {txn.fromAccount})</span>
            </div>
        </div>

        <div className="mt-12 mb-8">
            <p className="text-sm font-bold text-gray-500 mb-2">رقم القيد المرجعي: #{txn.serialNumber || txn.id.slice(-6)}</p>
        </div>

        {renderFooter()}
    </div>
  );

  return (
    <>
        {/* Modal Wrapper for Preview */}
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print">
            <div className="bg-gray-100 dark:bg-dark-900 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Modal Toolbar */}
                <div className="bg-white dark:bg-dark-800 p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Printer size={20} /> معاينة المستند قبل الطباعة
                    </h3>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 font-bold">إغلاق</button>
                        <button onClick={handlePrint} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
                            <Printer size={18} /> طباعة رسمية (PDF)
                        </button>
                    </div>
                </div>

                {/* Preview Scroll Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-200 dark:bg-black/50 flex justify-center custom-scrollbar">
                    {/* The Actual Document - A4 Aspect Ratio */}
                    <div className="printable-document bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-xl text-black flex flex-col relative">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                            <PenTool size={400} />
                        </div>
                        
                        {type === 'invoice' && renderInvoiceContent(data)}
                        {type === 'receipt' && renderReceiptContent(data)}
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};

export default DocumentPreview;
