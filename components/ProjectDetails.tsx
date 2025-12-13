
import React, { useState, useEffect } from 'react';
import { Project, Invoice, Transaction, Employee, TransactionType, InvoiceType, ProjectStatus, Agreement, ProjectNote, LedgerEntry, ProjectType, ContractType, EmployeeType } from '../types';
import { MOCK_INVOICES, MOCK_TRANSACTIONS, MOCK_EMPLOYEES } from '../constants';
import { formatCurrency } from '../services/dataService';
import { 
  ArrowRight, Briefcase, MapPin, Calendar, DollarSign, TrendingUp, TrendingDown, 
  Activity, ScrollText, Receipt, Eye, ChevronDown, ChevronUp, FileSignature, 
  StickyNote, Plus, Send, Upload, Trash2, Edit, Coins, Percent, PieChart, 
  Wallet, Hammer, FileText, Users, PenTool, AlertTriangle, AlertCircle
} from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface ProjectDetailsProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onBack: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onUpdateProject, onBack }) => {
  const [activeTab, setActiveTab] = useState<'financials' | 'team' | 'statement' | 'invoices' | 'agreements' | 'notes'>('financials');
  
  // Local State for Modals
  const [isPercentModalOpen, setIsPercentModalOpen] = useState(false);
  const [newPercentage, setNewPercentage] = useState<number>(project.companyPercentage || 0);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState<number>(project.budget);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [newProgress, setNewProgress] = useState<number>(project.progress);
  
  // Workshop Fund Modals
  const [isFundSettingsModalOpen, setIsFundSettingsModalOpen] = useState(false);
  const [workshopBalance, setWorkshopBalance] = useState<number>(project.workshopBalance || 0);
  const [workshopThreshold, setWorkshopThreshold] = useState<number>(project.workshopThreshold || 0);

  // Agreement State
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [newAgreement, setNewAgreement] = useState<Partial<Agreement>>({
      id: undefined, employeeId: '', amount: 0, title: '', date: new Date().toISOString().split('T')[0]
  });

  // Notes State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);

  useEffect(() => {
     setNewPercentage(project.companyPercentage || 0);
     setNewBudget(project.budget);
     setNewProgress(project.progress);
     setWorkshopBalance(project.workshopBalance || 0);
     setWorkshopThreshold(project.workshopThreshold || 0);
  }, [project]);

  // Logic to identify Design Project
  const isDesignProject = project.status === ProjectStatus.DESIGN || project.type === ProjectType.DESIGN;
  const isLumpSum = project.contractType === ContractType.LUMP_SUM;

  // Check for Alert Condition
  const isWorkshopFundLow = !isDesignProject && (project.workshopBalance !== undefined) && (project.workshopThreshold !== undefined) && (project.workshopBalance <= project.workshopThreshold);

  // Filter Data
  const projectInvoices = MOCK_INVOICES.filter(inv => inv.projectId === project.id);
  const projectTransactions = MOCK_TRANSACTIONS.filter(txn => txn.projectId === project.id);

  // Financial Calculations
  const totalExpenses = projectTransactions
    .filter(t => t.type === TransactionType.PAYMENT)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalReceived = projectTransactions
    .filter(t => t.type === TransactionType.RECEIPT)
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  // Calculate Actual Labor Cost (For Lump Sum tracking)
  const totalLaborCost = projectTransactions
    .filter(t => 
        t.type === TransactionType.PAYMENT && 
        (t.recipientType === 'Craftsman' || t.recipientType === 'Worker')
    )
    .reduce((acc, curr) => acc + curr.amount, 0);

  const contractValue = project.budget;
  
  // PROFIT & SHARE CALCULATION LOGIC
  let companyShareValue = 0;
  let remainingPayments = 0;

  if (isDesignProject) {
      remainingPayments = contractValue - totalReceived;
  } else {
      if (isLumpSum) {
          // Lump Sum: Profit = Revenue (Received) - Expenses. 
          // Remaining Client Payment = Contract - Received
          companyShareValue = totalReceived - totalExpenses; // Net Profit realized so far
          remainingPayments = contractValue - totalReceived;
      } else {
          // Percentage (Cost Plus): Client Pays Expenses + Percentage.
          // Remaining is tricky here, usually it's "Unpaid invoices + Unpaid Percentage".
          // Simplified for dashboard: (Received - Expenses - Profit) -> should be 0 if balanced.
          const profitShouldBe = (totalExpenses * (project.companyPercentage || 0)) / 100;
          companyShareValue = profitShouldBe;
          remainingPayments = (totalExpenses + profitShouldBe) - totalReceived; // What the client owes based on work done
      }
  }

  const financialProgress = contractValue > 0 ? Math.min(Math.round((totalExpenses / contractValue) * 100), 100) : 0;
  const technicalProgress = project.progress;

  // Prepare Ledger Data
  const ledgerData: LedgerEntry[] = [
    ...projectTransactions.map(t => ({ ...t, rowType: (t.type === TransactionType.RECEIPT ? 'receipt' : 'payment') as 'receipt' | 'payment' })),
    ...projectInvoices.map(i => ({ ...i, rowType: 'invoice' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Data helpers
  const getWorkingTeam = () => {
     const teamMap = new Map<string, { employee: Employee, totalReceived: number, totalWorkValue: number }>();
     projectInvoices.forEach(inv => {
        if (inv.relatedEmployeeId) {
            const emp = MOCK_EMPLOYEES.find(e => e.id === inv.relatedEmployeeId);
            if (emp) {
                if (!teamMap.has(emp.id)) teamMap.set(emp.id, { employee: emp, totalReceived: 0, totalWorkValue: 0 });
                const entry = teamMap.get(emp.id)!;
                entry.totalWorkValue += inv.amount;
            }
        }
     });
     projectTransactions.forEach(txn => {
         if (txn.recipientId) {
            const emp = MOCK_EMPLOYEES.find(e => e.id === txn.recipientId);
            if (emp) {
                if (!teamMap.has(emp.id)) teamMap.set(emp.id, { employee: emp, totalReceived: 0, totalWorkValue: 0 });
                const entry = teamMap.get(emp.id)!;
                entry.totalReceived += txn.amount;
            }
         }
     });
     return Array.from(teamMap.values());
  };
  const workingTeam = getWorkingTeam();

  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.EXECUTION: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case ProjectStatus.DESIGN: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Handlers
  const handleUpdateBudget = (e: React.FormEvent) => { e.preventDefault(); onUpdateProject({ ...project, budget: newBudget }); setIsBudgetModalOpen(false); };
  const handleUpdatePercentage = (e: React.FormEvent) => { e.preventDefault(); onUpdateProject({ ...project, companyPercentage: newPercentage }); setIsPercentModalOpen(false); };
  const handleUpdateProgress = (e: React.FormEvent) => { e.preventDefault(); onUpdateProject({ ...project, progress: newProgress }); setIsProgressModalOpen(false); };
  
  const handleUpdateFundSettings = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateProject({ 
          ...project, 
          workshopBalance: workshopBalance, 
          workshopThreshold: workshopThreshold 
      });
      setIsFundSettingsModalOpen(false);
  };

  const handleSaveAgreement = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAgreement.employeeId || !newAgreement.amount || !newAgreement.title) return;
      let updatedAgreements;
      if (newAgreement.id) {
          updatedAgreements = project.agreements?.map(agr => agr.id === newAgreement.id ? { ...agr, ...newAgreement } as Agreement : agr);
      } else {
          const agreement: Agreement = {
              id: `agr-${Date.now()}`, employeeId: newAgreement.employeeId, amount: newAgreement.amount, title: newAgreement.title,
              date: newAgreement.date || new Date().toISOString().split('T')[0], attachmentUrl: newAgreement.attachmentUrl
          };
          updatedAgreements = [...(project.agreements || []), agreement];
      }
      onUpdateProject({ ...project, agreements: updatedAgreements });
      setIsAgreementModalOpen(false);
      setNewAgreement({ id: undefined, employeeId: '', amount: 0, title: '', date: new Date().toISOString().split('T')[0] });
  };
  
  const handleEditAgreement = (agr: Agreement) => { setNewAgreement(agr); setIsAgreementModalOpen(true); };
  
  const handleDeleteAgreement = (id: string) => {
      if (confirm('هل أنت متأكد من حذف هذا العقد؟')) {
          onUpdateProject({ ...project, agreements: project.agreements?.filter(a => a.id !== id) });
      }
  };

  const handleAddNote = () => { 
      if (!newNoteContent.trim()) return;
      const note: ProjectNote = { id: `note-${Date.now()}`, content: newNoteContent, date: new Date().toISOString().split('T')[0], author: 'المستخدم الحالي' };
      onUpdateProject({ ...project, notes: [...(project.notes || []), note] });
      setNewNoteContent('');
  };
  
  const handleEditNote = (note: ProjectNote) => { setEditingNote(note); setIsEditNoteModalOpen(true); };
  
  const handleUpdateNote = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingNote || !editingNote.content.trim()) return;
      const updatedNotes = project.notes?.map(n => n.id === editingNote.id ? editingNote : n);
      onUpdateProject({ ...project, notes: updatedNotes });
      setIsEditNoteModalOpen(false);
      setEditingNote(null);
  };
  
  const handleDeleteNote = (id: string) => {
      if (confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
          onUpdateProject({ ...project, notes: project.notes?.filter(n => n.id !== id) });
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewAgreement({...newAgreement, attachmentUrl: URL.createObjectURL(e.target.files[0])});
    }
  };

  const employeeOptions = MOCK_EMPLOYEES.filter(e => e.type !== 'Staff').map(e => ({ value: e.id, label: e.name }));

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Alert Banner for Low Workshop Fund */}
      {isWorkshopFundLow && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="text-red-600 dark:text-red-400 w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                  <h3 className="text-red-800 dark:text-red-300 font-bold text-lg">تنبيه: رصيد صندوق الورشة منخفض</h3>
                  <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                      وصل رصيد صندوق الورشة إلى {formatCurrency(project.workshopBalance || 0)} وهو أقل من حد الأمان المحدد ({formatCurrency(project.workshopThreshold || 0)}). يرجى طلب دفعة من العميل لضمان استمرار العمل.
                  </p>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 transition-colors"><ArrowRight size={20} /></button>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{project.name}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>{project.status}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-300 text-xs font-bold border border-gray-200 dark:border-dark-600">
                        {project.contractType || ContractType.PERCENTAGE}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Briefcase size={14}/> {project.clientName}</span>
                    <span className="flex items-center gap-1"><MapPin size={14}/> {project.location}</span>
                </div>
            </div>
        </div>
        
        {/* Progress Logic */}
        <div className="flex items-center gap-8 bg-gray-50 dark:bg-dark-800 p-3 rounded-xl border border-gray-100 dark:border-dark-700">
            <div className="text-center group relative">
                <div className="flex items-center gap-1 justify-center mb-1">
                    <Activity size={12} className="text-primary-600" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">الإنجاز الفني</span>
                </div>
                <div className="relative w-14 h-14 flex items-center justify-center mx-auto">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-dark-600" />
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * technicalProgress) / 100} className="text-primary-600" />
                     </svg>
                     <span className="absolute text-xs font-bold text-primary-700 dark:text-primary-400">{technicalProgress}%</span>
                </div>
                <button 
                  onClick={() => setIsProgressModalOpen(true)} 
                  className="absolute -bottom-2 -right-2 bg-gray-200 dark:bg-dark-600 p-1.5 rounded-full shadow border border-gray-300 dark:border-dark-500 text-gray-700 dark:text-gray-200 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 transition-colors z-10"
                  title="تعديل نسبة الإنجاز"
                >
                  <Edit size={12} />
                </button>
            </div>

            {!isDesignProject && (
                <>
                    <div className="w-px h-12 bg-gray-200 dark:bg-dark-600"></div>
                    <div className="text-center">
                        <div className="flex items-center gap-1 justify-center mb-1">
                            <DollarSign size={12} className="text-green-600" />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">الإنجاز المالي</span>
                        </div>
                        <div className="relative w-14 h-14 flex items-center justify-center mx-auto">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-dark-600" />
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * financialProgress) / 100} className={`${financialProgress > technicalProgress ? 'text-red-500' : 'text-green-500'}`} />
                             </svg>
                             <span className={`absolute text-xs font-bold ${financialProgress > technicalProgress ? 'text-red-600' : 'text-green-600'}`}>{financialProgress}%</span>
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Workshop Fund Card */}
      {!isDesignProject && (
          <div className={`p-6 rounded-2xl shadow-sm border flex justify-between items-center ${isWorkshopFundLow ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900' : 'bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800'}`}>
              <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${isWorkshopFundLow ? 'bg-red-100 text-red-600' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'}`}>
                      <Coins size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">صندوق الورشة</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                          الرصيد المتوفر: <span className={`font-bold ${isWorkshopFundLow ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(project.workshopBalance || 0)}</span>
                          <span className="mx-2 text-gray-300">|</span>
                          حد الأمان (الإنذار): <span className="font-bold text-gray-700 dark:text-gray-300">{formatCurrency(project.workshopThreshold || 0)}</span>
                      </p>
                  </div>
              </div>
              <button 
                  onClick={() => setIsFundSettingsModalOpen(true)}
                  className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
              >
                  <Edit size={16} />
                  إدارة الصندوق
              </button>
          </div>
      )}

      {/* SPECIAL SECTION: Labor Budget Tracking for Lump Sum */}
      {isLumpSum && project.agreedLaborBudget && project.agreedLaborBudget > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                      <Users size={20} />
                      مراقبة ميزانية الأجور (مبلغ مقطوع)
                  </h3>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-bold">
                      تم التثبيت: {formatCurrency(project.agreedLaborBudget)}
                  </span>
              </div>
              
              {/* Progress Bar for Labor Cost */}
              <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                      <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 dark:bg-blue-900 dark:text-blue-200">
                              المنصرف فعلياً
                          </span>
                      </div>
                      <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-300">
                              {Math.min(Math.round((totalLaborCost / project.agreedLaborBudget) * 100), 100)}%
                          </span>
                      </div>
                  </div>
                  <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-blue-200 dark:bg-blue-900/30">
                      <div 
                          style={{ width: `${Math.min((totalLaborCost / project.agreedLaborBudget) * 100, 100)}%` }} 
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${totalLaborCost > project.agreedLaborBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                      ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                          تم صرف: <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(totalLaborCost)}</span>
                      </p>
                      <p className={`${totalLaborCost > project.agreedLaborBudget ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                          {totalLaborCost > project.agreedLaborBudget 
                              ? `تجاوز الميزانية بـ ${formatCurrency(totalLaborCost - project.agreedLaborBudget)}` 
                              : `المتبقي للأجور: ${formatCurrency(project.agreedLaborBudget - totalLaborCost)}`
                          }
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* Financial Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isDesignProject ? 'lg:grid-cols-3' : 'lg:grid-cols-5'} gap-4`}>
        {/* 1. Contract Value */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 relative group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">{isDesignProject ? 'كلفة التصميم (العقد)' : (isLumpSum ? 'قيمة العقد الإجمالية' : 'قيمة العقد التقديرية')}</p>
            <button 
              onClick={() => setIsBudgetModalOpen(true)} 
              className="p-1.5 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 transition-colors"
              title="تعديل القيمة"
            >
              <Edit size={16} />
            </button>
          </div>
          <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(contractValue)}</h3>
        </div>

        {/* 2. Received */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">إجمالي الدفعات المستلمة</p>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={18}/></div>
          </div>
          <h3 className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</h3>
        </div>

        {/* 3 & 4. Expenses & Percentage/Profit (Hidden for Design) */}
        {!isDesignProject && (
            <>
                <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 text-sm font-bold">إجمالي المصاريف</p>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingDown size={18}/></div>
                    </div>
                    <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(totalExpenses)}</h3>
                </div>
                
                {/* Dynamic Card: Percentage Share OR Lump Sum Profit */}
                <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 text-sm font-bold">
                            {isLumpSum ? 'صافي الربح المحقق' : 'نسبة الشركة المستحقة'}
                        </p>
                        {!isLumpSum && (
                            <button 
                              onClick={() => setIsPercentModalOpen(true)} 
                              className="p-1.5 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 transition-colors"
                              title="تعديل النسبة"
                            >
                              <Edit size={16} />
                            </button>
                        )}
                    </div>
                    <h3 className={`text-2xl font-bold ${isLumpSum ? (companyShareValue >= 0 ? 'text-green-600' : 'text-red-600') : 'text-purple-600'}`}>
                        {formatCurrency(companyShareValue)}
                    </h3>
                    <div className="mt-1">
                        {isLumpSum ? (
                            <span className="text-xs text-gray-400 font-bold px-1 py-0.5 rounded">
                                (المقبوض - المصروف)
                            </span>
                        ) : (
                            <span className="text-xs text-purple-500 font-bold bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                                النسبة الحالية: {project.companyPercentage || 0}%
                            </span>
                        )}
                    </div>
                </div>
            </>
        )}

        {/* 5. Remaining */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">
                {isDesignProject || isLumpSum ? 'المتبقي من العقد' : 'المتبقي المستحق'}
            </p>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><PieChart size={18}/></div>
          </div>
          <h3 className={`text-2xl font-bold ${remainingPayments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remainingPayments)}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
              {isDesignProject || isLumpSum ? '(العقد - المقبوضات)' : '(المستحق - المقبوضات)'}
          </p>
        </div>
      </div>

      {/* TABS Content ... (Existing tabs code remains) */}
      <div className="space-y-4">
         <div className="flex flex-wrap bg-gray-100 dark:bg-dark-800 p-1 rounded-xl w-fit overflow-x-auto">
            <button onClick={() => setActiveTab('financials')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'financials' ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>السجل المالي</button>
            {!isDesignProject && (
                <>
                    <button onClick={() => setActiveTab('statement')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'statement' ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><ScrollText size={16} /> الكشف المؤقت</button>
                    <button onClick={() => setActiveTab('invoices')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'invoices' ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><Receipt size={16} /> الفواتير</button>
                    <button onClick={() => setActiveTab('team')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'team' ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>فريق العمل</button>
                    <button onClick={() => setActiveTab('agreements')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'agreements' ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><FileSignature size={16} /> الإتفاقيات والعقود</button>
                </>
            )}
            <button onClick={() => setActiveTab('notes')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'notes' ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><StickyNote size={16} /> الملاحظات</button>
         </div>

         {/* Content Area */}
         {activeTab === 'financials' && (
             <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 dark:border-dark-800">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Wallet className="text-primary-600" size={20} /> السجل المالي</h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500">
                            <tr><th>التاريخ</th><th>النوع</th><th>الوصف</th><th>دائن (قبض)</th><th>مدين (صرف)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {ledgerData.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{row.date}</td>
                                    <td className="px-6 py-4">
                                        {row.rowType === 'invoice' ? <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">فاتورة</span> : 
                                         <span className={`text-[10px] px-2 py-0.5 rounded ${row.type === TransactionType.RECEIPT ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.type}</span>}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{row.rowType === 'invoice' ? row.category : row.description}</td>
                                    <td className="px-6 py-4 text-green-600 font-bold">{(row.rowType === 'receipt' || (row.rowType === 'payment' && row.type === TransactionType.RECEIPT)) ? formatCurrency(row.amount) : '-'}</td>
                                    <td className="px-6 py-4 text-blue-600 font-bold">{(row.rowType === 'invoice' || row.rowType === 'payment') ? formatCurrency(row.amount) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             </div>
         )}
         
         {activeTab === 'statement' && !isDesignProject && (
             <div className="text-center py-10 text-gray-400 bg-white dark:bg-dark-900 rounded-xl">محتوى الكشف المؤقت</div>
         )}
         
         {activeTab === 'notes' && (
             <div className="space-y-6 h-full flex flex-col">
                 <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                     <textarea className="w-full p-3 border border-gray-200 dark:border-dark-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:text-white" rows={3} placeholder="اكتب ملاحظاتك هنا..." value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} />
                     <div className="flex justify-end mt-2">
                         <button onClick={handleAddNote} disabled={!newNoteContent.trim()} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-700 disabled:opacity-50"><Send size={16} /> إضافة الملاحظة</button>
                     </div>
                 </div>
                 <div className="space-y-4">
                     {project.notes && project.notes.length > 0 ? project.notes.map(note => (
                         <div key={note.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                             <div className="flex justify-between items-start mb-2">
                                 <span className="flex items-center gap-2 text-xs font-bold text-yellow-800 dark:text-yellow-500"><StickyNote size={14} />{note.author || 'مستخدم'}</span>
                                 <span className="text-[10px] text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">{note.date}</span>
                             </div>
                             <p className="text-gray-800 dark:text-gray-200 text-sm">{note.content}</p>
                         </div>
                     )) : <div className="text-center py-10 text-gray-400">لا توجد ملاحظات.</div>}
                 </div>
             </div>
         )}
         
         {activeTab === 'team' && !isDesignProject && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {workingTeam.length > 0 ? workingTeam.map((item, idx) => (
                     <div key={idx} className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden group">
                         <div className="p-6 flex items-start gap-4">
                             <img src={item.employee.avatar} alt={item.employee.name} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                             <div>
                                 <h3 className="font-bold text-gray-800 dark:text-white">{item.employee.name}</h3>
                                 <p className="text-primary-600 text-sm">{item.employee.role}</p>
                             </div>
                         </div>
                         <div className="bg-gray-50 dark:bg-dark-800 p-4 border-t border-gray-100 dark:border-dark-700 space-y-3">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-gray-500 dark:text-gray-400">إنجاز أعمال بقيمة:</span>
                                 <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalWorkValue)}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-gray-500 dark:text-gray-400">مقبوضات مستلمة:</span>
                                 <span className="font-bold text-green-600">{formatCurrency(item.totalReceived)}</span>
                             </div>
                         </div>
                     </div>
                 )) : (
                     <div className="col-span-3 text-center py-12 bg-white dark:bg-dark-900 rounded-2xl border border-dashed border-gray-200 dark:border-dark-700">
                         <Users size={48} className="mx-auto text-gray-300 mb-3" />
                         <p className="text-gray-500">لا يوجد فريق عمل مرتبط بمدفوعات هذا المشروع حالياً.</p>
                     </div>
                 )}
             </div>
         )}
      </div>

      {/* Fund Settings Modal */}
      <Modal isOpen={isFundSettingsModalOpen} onClose={() => setIsFundSettingsModalOpen(false)} title="إدارة صندوق الورشة">
          <form onSubmit={handleUpdateFundSettings} className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                      يستخدم صندوق الورشة للمصاريف اليومية والسريعة. تحديد حد الأمان (نقطة الصفر) يساعدك في معرفة متى يجب طلب دفعة جديدة من العميل قبل توقف العمل.
                  </p>
              </div>
              
              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الرصيد الحالي للصندوق</label>
                  <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-xl font-bold text-center bg-gray-50 dark:bg-dark-800 dark:text-white"
                      value={workshopBalance} 
                      onChange={(e) => setWorkshopBalance(Number(e.target.value))} 
                  />
                  <p className="text-xs text-gray-500 mt-1">يتم تحديث هذا الرقم تلقائياً عند تسجيل المصروفات، ويمكنك تعديله يدوياً هنا.</p>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">حد الأمان (نقطة الصفر - الإنذار)</label>
                  <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-red-200 dark:border-red-900/50 rounded-lg text-xl font-bold text-center text-red-600 bg-red-50 dark:bg-red-900/10"
                      value={workshopThreshold} 
                      onChange={(e) => setWorkshopThreshold(Number(e.target.value))} 
                  />
                  <p className="text-xs text-gray-500 mt-1">سيظهر تنبيه لك وللعميل عندما ينخفض الرصيد عن هذا المبلغ.</p>
              </div>

              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-primary-700 transition-colors">
                  حفظ الإعدادات
              </button>
          </form>
      </Modal>

      {/* Existing Modals */}
      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="تعديل القيمة">
          <form onSubmit={handleUpdateBudget} className="space-y-6">
              <div><input type="number" className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-xl font-bold text-center dark:bg-dark-800 dark:text-white" value={newBudget} onChange={(e) => setNewBudget(Number(e.target.value))} /></div>
              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2.5 rounded-lg">تحديث</button>
          </form>
      </Modal>
      
      <Modal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} title="تحديث الإنجاز">
          <form onSubmit={handleUpdateProgress} className="space-y-6">
              <div><input type="range" min="0" max="100" className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600" value={newProgress} onChange={(e) => setNewProgress(Number(e.target.value))} /><div className="text-center font-bold mt-2 dark:text-white">{newProgress}%</div></div>
              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2.5 rounded-lg">حفظ</button>
          </form>
      </Modal>
      
      <Modal isOpen={isAgreementModalOpen} onClose={() => setIsAgreementModalOpen(false)} title={newAgreement.id ? "تعديل العقد" : "إضافة عقد جديد"}>
          <form onSubmit={handleSaveAgreement} className="space-y-4">
              <div><label className="block text-sm mb-1">العنوان</label><input required className="w-full border p-2 rounded" value={newAgreement.title} onChange={e => setNewAgreement({...newAgreement, title: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">المبلغ</label><input required type="number" className="w-full border p-2 rounded" value={newAgreement.amount} onChange={e => setNewAgreement({...newAgreement, amount: Number(e.target.value)})} /></div>
              <div>
                  <SearchableSelect 
                    label="الموظف"
                    options={employeeOptions}
                    value={newAgreement.employeeId || ''}
                    onChange={(val) => setNewAgreement({...newAgreement, employeeId: val})}
                    placeholder="اختر الموظف..."
                  />
              </div>
              <button className="w-full bg-primary-600 text-white p-2 rounded">حفظ</button>
          </form>
      </Modal>

      <Modal isOpen={isEditNoteModalOpen} onClose={() => setIsEditNoteModalOpen(false)} title="تعديل الملاحظة">
          <form onSubmit={handleUpdateNote} className="space-y-4">
              <textarea className="w-full border p-2 rounded h-32" value={editingNote?.content || ''} onChange={e => editingNote && setEditingNote({...editingNote, content: e.target.value})} />
              <button className="w-full bg-primary-600 text-white p-2 rounded">حفظ</button>
          </form>
      </Modal>

       <Modal isOpen={isPercentModalOpen} onClose={() => setIsPercentModalOpen(false)} title="تحديث نسبة الشركة">
          <form onSubmit={handleUpdatePercentage} className="space-y-6">
              <div><input type="number" className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-xl font-bold text-center dark:bg-dark-800 dark:text-white" value={newPercentage} onChange={(e) => setNewPercentage(Number(e.target.value))} /></div>
              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2.5 rounded-lg">حفظ</button>
          </form>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
