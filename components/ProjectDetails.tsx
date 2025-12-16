
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Invoice, Transaction, Employee, TransactionType, InvoiceType, ProjectStatus, Agreement, ProjectNote, LedgerEntry, ProjectType, ContractType, EmployeeType, StatementColumn, StatementRow } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { getRecentInvoices, formatCurrency } from '../services/dataService';
import { 
  ArrowRight, Briefcase, MapPin, Calendar, DollarSign, TrendingUp, TrendingDown, 
  Activity, ScrollText, Receipt, ChevronDown, ChevronUp, FileSignature, 
  StickyNote, Plus, Send, Upload, Trash2, Edit, Coins, Percent, PieChart, 
  Wallet, Hammer, FileText, Users, PenTool, AlertTriangle, Settings, PlusSquare, Link,
  Eye, EyeOff, CheckCircle, File, AlignLeft, Printer, Calculator, Layers, LayoutList, Info, AlertCircle
} from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface ProjectDetailsProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void; 
  onBack: () => void;
  employees?: Employee[];
  transactions?: Transaction[]; 
  projects?: Project[]; 
  onViewProject?: (project: Project) => void; 
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onUpdateProject, onDeleteProject, onBack, employees = MOCK_EMPLOYEES, transactions = [], projects = [], onViewProject }) => {
  // Main View Tabs
  const [activeTab, setActiveTab] = useState<'financials' | 'team' | 'statement' | 'invoices' | 'agreements' | 'notes'>('financials');
  
  // Final Statement View State
  const [showFinalStatement, setShowFinalStatement] = useState(false);
  const [finalStatementTab, setFinalStatementTab] = useState<string>('summary');

  // Data State
  const [projectInvoices, setProjectInvoices] = useState<Invoice[]>([]);
  // Use prop transactions filtered by project
  const projectTransactions = useMemo(() => transactions.filter(txn => txn.projectId === project.id), [transactions, project.id]);

  // Local State for Modals
  const [isPercentModalOpen, setIsPercentModalOpen] = useState(false);
  const [newPercentage, setNewPercentage] = useState<number>(project.companyPercentage || 0);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState<number>(project.budget);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [newProgress, setNewProgress] = useState<number>(project.progress);
  
  // Workshop Fund Modals
  const [isFundSettingsModalOpen, setIsFundSettingsModalOpen] = useState(false);
  const [workshopThreshold, setWorkshopThreshold] = useState<number>(project.workshopThreshold || 0);

  // Agreement State
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [newAgreement, setNewAgreement] = useState<Partial<Agreement>>({
      id: undefined, employeeId: '', amount: 0, title: '', date: new Date().toISOString().split('T')[0], type: 'file', content: ''
  });
  
  // Agreement Viewer State
  const [viewAgreement, setViewAgreement] = useState<Agreement | null>(null);

  // Statement Logic
  const [isStatementRowModalOpen, setIsStatementRowModalOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [currentStatementRow, setCurrentStatementRow] = useState<Partial<StatementRow>>({});
  const [statementColumns, setStatementColumns] = useState<StatementColumn[]>(project.statementColumns || []);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'number'>('text');

  // Notes State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);

  // --- 1. Fetch Data on Mount/Update ---
  useEffect(() => {
     setNewPercentage(project.companyPercentage || 0);
     setNewBudget(project.budget);
     setNewProgress(project.progress);
     setWorkshopThreshold(project.workshopThreshold || 0);
     
     // Initialize default columns if not present
     if (!project.statementColumns || project.statementColumns.length === 0) {
         setStatementColumns([
             { id: 'item', label: 'البيان / البند', type: 'text' },
             { id: 'paid', label: 'المصاريف المدفوعة', type: 'number' },
             { id: 'agreed', label: 'المتفق عليه', type: 'number' },
             { id: 'expected', label: 'المتبقي', type: 'number' }, // Renamed from "المتوقع" to "المتبقي"
             { id: 'notes', label: 'ملاحظات', type: 'text' },
         ]);
     } else {
         setStatementColumns(project.statementColumns);
     }

     // Fetch Invoices and Transactions explicitly to ensure freshness
     getRecentInvoices().then(allInvoices => {
         setProjectInvoices(allInvoices.filter(inv => inv.projectId === project.id));
     });

  }, [project]);

  // Financial Calculations
  const totalExpenses = projectTransactions
    .filter(t => t.type === TransactionType.PAYMENT)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalReceived = projectTransactions
    .filter(t => t.type === TransactionType.RECEIPT)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Logic to identify Design Project & Contract Type
  const isDesignProject = project.status === ProjectStatus.DESIGN || project.type === ProjectType.DESIGN;
  const isLumpSum = project.contractType === ContractType.LUMP_SUM;

  // --- PROFIT & BALANCE CALCULATION LOGIC ---
  
  // 1. Calculate Company Share (The amount that "belongs" to the company)
  let calculatedCompanyShare = 0;
  if (!isLumpSum) {
      // Cost Plus: Share = Expenses * Percentage
      calculatedCompanyShare = (totalExpenses * (project.companyPercentage || 0)) / 100;
  } else {
      // Lump Sum: We do not deduct "share" from the daily fund balance usually, 
      // but if we want to show strict cash flow, it's just (Received - Expenses).
      calculatedCompanyShare = 0; 
  }

  // 2. Calculate Real Workshop Balance (Net Balance)
  // Formula: Total Received - Total Expenses - Company Share
  // This ensures the fund shows what is TRULY available for the project after accounting for company dues.
  const realWorkshopBalance = totalReceived - totalExpenses - calculatedCompanyShare;

  // 3. Display Value for Profit Card
  let profitDisplayValue = 0;
  if (isLumpSum) {
      profitDisplayValue = totalReceived - totalExpenses; // Net profit realized so far for Lump Sum
  } else {
      profitDisplayValue = calculatedCompanyShare; // The calculated fee for Cost Plus
  }

  // Check for Alert Condition (Using the NET balance)
  const isWorkshopFundLow = !isDesignProject && (project.workshopThreshold !== undefined) && (realWorkshopBalance <= project.workshopThreshold);

  // Calculate Actual Labor Cost (For Lump Sum tracking)
  const totalLaborCost = projectTransactions
    .filter(t => 
        t.type === TransactionType.PAYMENT && 
        (t.recipientType === 'Craftsman' || t.recipientType === 'Worker')
    )
    .reduce((acc, curr) => acc + curr.amount, 0);

  const contractValue = project.budget;
  
  const financialProgress = contractValue > 0 ? Math.min(Math.round((totalExpenses / contractValue) * 100), 100) : 0;
  const technicalProgress = project.progress;

  // Prepare Ledger Data
  const ledgerData: LedgerEntry[] = [
    ...projectTransactions.map(t => ({ ...t, rowType: (t.type === TransactionType.RECEIPT ? 'receipt' : 'payment') as 'receipt' | 'payment' })),
    ...projectInvoices.map(i => ({ ...i, rowType: 'invoice' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Navigation Logic for Previous Project
  const handleNavigateToRelatedProject = () => {
      if (project.relatedProjectId && onViewProject) {
          const relatedProject = projects.find(p => p.id === project.relatedProjectId);
          if (relatedProject) {
              onViewProject(relatedProject);
          } else {
              alert("تعذر العثور على المشروع المرتبط (قد يكون محذوفاً).");
          }
      } else {
          alert(`أجور التصميم للمرحلة السابقة: ${formatCurrency(project.previousStageFees || 0)}`);
      }
  };

  // Data helpers
  const getWorkingTeam = () => {
     const teamMap = new Map<string, { employee: Employee, totalReceived: number, totalWorkValue: number }>();
     projectInvoices.forEach(inv => {
        if (inv.relatedEmployeeId) {
            const emp = employees.find(e => e.id === inv.relatedEmployeeId);
            if (emp) {
                if (!teamMap.has(emp.id)) teamMap.set(emp.id, { employee: emp, totalReceived: 0, totalWorkValue: 0 });
                const entry = teamMap.get(emp.id)!;
                entry.totalWorkValue += inv.amount;
            }
        }
     });
     projectTransactions.forEach(txn => {
         if (txn.recipientId) {
            const emp = employees.find(e => e.id === txn.recipientId);
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

  const calculatePaidAmount = (statementItemId: string) => {
      return projectTransactions
        .filter(t => t.type === TransactionType.PAYMENT && t.statementItemId === statementItemId)
        .reduce((sum, t) => sum + t.amount, 0);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.EXECUTION: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case ProjectStatus.DESIGN: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
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
          workshopBalance: realWorkshopBalance, 
          workshopThreshold: workshopThreshold 
      });
      setIsFundSettingsModalOpen(false);
  };

  // ... (Other handlers unchanged) ...
  const handleSaveAgreement = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAgreement.employeeId || !newAgreement.amount || !newAgreement.title) return;
      if (newAgreement.type === 'text' && !newAgreement.content?.trim()) { alert('يرجى كتابة نص العقد.'); return; }
      let updatedAgreements;
      if (newAgreement.id) {
          updatedAgreements = project.agreements?.map(agr => agr.id === newAgreement.id ? { ...agr, ...newAgreement } as Agreement : agr);
      } else {
          const agreement: Agreement = {
              id: `agr-${Date.now()}`, employeeId: newAgreement.employeeId, amount: newAgreement.amount, title: newAgreement.title,
              date: newAgreement.date || new Date().toISOString().split('T')[0], attachmentUrl: newAgreement.attachmentUrl,
              type: newAgreement.type || 'file', content: newAgreement.content
          };
          updatedAgreements = [...(project.agreements || []), agreement];
      }
      onUpdateProject({ ...project, agreements: updatedAgreements });
      setIsAgreementModalOpen(false);
      setNewAgreement({ id: undefined, employeeId: '', amount: 0, title: '', date: new Date().toISOString().split('T')[0], type: 'file', content: '' });
  };
  const handleEditAgreement = (agr: Agreement) => { setNewAgreement(agr); setIsAgreementModalOpen(true); };
  const handleDeleteAgreement = (id: string) => {
      if (confirm('هل أنت متأكد من حذف هذا العقد؟')) { onUpdateProject({ ...project, agreements: project.agreements?.filter(a => a.id !== id) }); }
  };
  const openStatementRowModal = (row?: StatementRow) => {
      if (row) { setCurrentStatementRow({ ...row }); } else { setCurrentStatementRow({}); }
      setIsStatementRowModalOpen(true);
  };
  const handleSaveStatementRow = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentStatementRow[statementColumns[0].id]) { alert('يرجى تعبئة الحقل الأول على الأقل'); return; }
      let updatedRows: StatementRow[];
      if (currentStatementRow.id) {
          updatedRows = (project.statementRows || []).map(row => row.id === currentStatementRow.id ? { ...currentStatementRow, id: row.id } : row);
      } else {
          const newRow: StatementRow = { ...currentStatementRow, id: `stm-row-${Date.now()}` };
          updatedRows = [...(project.statementRows || []), newRow];
      }
      onUpdateProject({ ...project, statementRows: updatedRows });
      setIsStatementRowModalOpen(false);
  };
  const handleDeleteStatementRow = (id: string) => {
      if (confirm('هل أنت متأكد من حذف هذا الصف؟')) {
          const updatedRows = (project.statementRows || []).filter(row => row.id !== id);
          onUpdateProject({ ...project, statementRows: updatedRows });
      }
  };
  const handleAddColumn = () => {
      if (!newColumnName) return;
      const newCol: StatementColumn = { id: `col-${Date.now()}`, label: newColumnName, type: newColumnType };
      const updatedColumns = [...statementColumns, newCol];
      setStatementColumns(updatedColumns);
      onUpdateProject({ ...project, statementColumns: updatedColumns });
      setNewColumnName('');
    };
  const handleRemoveColumn = (id: string) => {
      if (statementColumns.length <= 1) { alert("لا يمكن حذف جميع الأعمدة."); return; }
      if (confirm('هل أنت متأكد؟ سيتم حذف البيانات المرتبطة بهذا العمود.')) {
          const updatedColumns = statementColumns.filter(c => c.id !== id);
          setStatementColumns(updatedColumns);
          onUpdateProject({ ...project, statementColumns: updatedColumns });
      }
  };
  const handleRenameColumn = (id: string, newLabel: string) => {
      const updatedColumns = statementColumns.map(c => c.id === id ? { ...c, label: newLabel } : c);
      setStatementColumns(updatedColumns);
      onUpdateProject({ ...project, statementColumns: updatedColumns });
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
      if (confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) { onUpdateProject({ ...project, notes: project.notes?.filter(n => n.id !== id) }); }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewAgreement({ ...newAgreement, attachmentUrl: URL.createObjectURL(e.target.files[0]), type: 'file' });
    }
  };
  const employeeOptions = employees.filter(e => e.type !== 'Staff').map(e => ({ value: e.id, label: e.name }));

  // --- RENDER FINAL STATEMENT VIEW ---
  if (showFinalStatement) {
      return (
          <div className="space-y-6 animate-in fade-in duration-300 min-h-screen bg-gray-50 dark:bg-dark-950 p-6 -m-4 md:-m-8 print:m-0 print:p-0 print:bg-white print:text-black">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 no-print">
                  <div className="flex items-center gap-4">
                      <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl text-primary-600 dark:text-primary-400">
                          <LayoutList size={28} />
                      </div>
                      <div>
                          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الكشف النهائي للأعمال</h1>
                          <p className="text-gray-500 dark:text-gray-400 mt-1">مشروع: {project.name}</p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => window.print()}
                          className="flex items-center gap-2 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg font-bold border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                          <Printer size={18} />
                          طباعة
                      </button>
                      <button 
                          onClick={() => setShowFinalStatement(false)}
                          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-primary-500/30"
                      >
                          <ArrowRight size={18} />
                          عودة للمشروع
                      </button>
                  </div>
              </div>
              {/* ... Final Statement Content ... */}
          </div>
      );
  }

  // --- STANDARD PROJECT DETAILS VIEW ---
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Alert Banner for Low Workshop Fund - Uses NET Balance (Received - Expenses - Share) */}
      {isWorkshopFundLow && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="text-red-600 dark:text-red-400 w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                  <h3 className="text-red-800 dark:text-red-300 font-bold text-lg">تنبيه: رصيد صندوق الورشة منخفض</h3>
                  <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                      الرصيد المتاح للمشروع ({formatCurrency(realWorkshopBalance)}) أقل من حد الأمان المحدد ({formatCurrency(project.workshopThreshold || 0)}). يرجى طلب دفعة من العميل.
                  </p>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors dark:text-white"><ArrowRight size={20} /></button>
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
        
        <div className="flex items-center gap-4">
            {project.previousStageFees && project.previousStageFees > 0 && (
                <button 
                    onClick={handleNavigateToRelatedProject}
                    className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-4 py-2.5 rounded-xl font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all shadow-sm"
                    title={project.relatedProjectId ? "اضغط للانتقال إلى مشروع التصميم" : "عرض قيمة الأجور"}
                >
                    <Info size={18} />
                    <span>أجور التصميم (مشروع سابق)</span>
                </button>
            )}

            {onDeleteProject && (
                <button 
                    onClick={() => onDeleteProject(project.id)}
                    className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-900/30"
                    title="حذف المشروع نهائياً"
                >
                    <Trash2 size={18} />
                </button>
            )}

            {!isDesignProject && (
                <button 
                    onClick={() => setShowFinalStatement(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                    <LayoutList size={20} />
                    <span>الكشف النهائي للأعمال</span>
                </button>
            )}

            {/* Progress Logic */}
            <div className="flex items-center gap-8 bg-gray-50 dark:bg-dark-800 p-3 rounded-xl border border-gray-100 dark:border-dark-700">
                <div className="text-center group relative">
                    <div className="flex items-center gap-1 justify-center mb-1">
                        <Activity size={12} className="text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">الإنجاز الفني</span>
                    </div>
                    <div className="relative w-14 h-14 flex items-center justify-center mx-auto">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-dark-600" />
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * technicalProgress) / 100} className="text-primary-600 dark:text-primary-500" />
                        </svg>
                        <span className="absolute text-xs font-bold text-primary-700 dark:text-primary-400">{technicalProgress}%</span>
                    </div>
                    <button onClick={() => setIsProgressModalOpen(true)} className="absolute -bottom-2 -right-2 bg-gray-200 dark:bg-dark-600 p-1.5 rounded-full shadow border border-gray-300 dark:border-dark-500 text-gray-700 dark:text-gray-200 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 transition-colors z-10"><Edit size={12} /></button>
                </div>

                {!isDesignProject && (
                    <>
                        <div className="w-px h-12 bg-gray-200 dark:bg-dark-600"></div>
                        <div className="text-center">
                            <div className="flex items-center gap-1 justify-center mb-1">
                                <DollarSign size={12} className="text-green-600 dark:text-green-400" />
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">الإنجاز المالي</span>
                            </div>
                            <div className="relative w-14 h-14 flex items-center justify-center mx-auto">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-dark-600" />
                                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * financialProgress) / 100} className={`${financialProgress > technicalProgress ? 'text-red-500' : 'text-green-500'}`} />
                                </svg>
                                <span className={`absolute text-xs font-bold ${financialProgress > technicalProgress ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{financialProgress}%</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
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
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">صندوق الورشة (المتبقي للمشروع)</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                          الرصيد المتوفر: <span className={`font-bold ${isWorkshopFundLow ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{formatCurrency(realWorkshopBalance)}</span>
                          <span className="mx-2 text-gray-300">|</span>
                          حد الأمان (الإنذار): <span className="font-bold text-gray-700 dark:text-gray-300">{formatCurrency(project.workshopThreshold || 0)}</span>
                          <br />
                          <span className="text-[10px] text-gray-400 mt-1 block">
                              * الرصيد = المقبوضات - (المصاريف + نسبة الشركة)
                          </span>
                      </p>
                  </div>
              </div>
              <button onClick={() => setIsFundSettingsModalOpen(true)} className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"><Edit size={16} /> إدارة الصندوق</button>
          </div>
      )}

      {/* Financial Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isDesignProject ? 'lg:grid-cols-3' : 'lg:grid-cols-5'} gap-4`}>
        {/* 1. Contract Value */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 relative group">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">
                    {isDesignProject || isLumpSum ? 'قيمة العقد' : 'الميزانية التقديرية'}
                </p>
            </div>
            <button onClick={() => setIsBudgetModalOpen(true)} className="p-1.5 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 transition-colors"><Edit size={16} /></button>
          </div>
          <h3 className={`text-2xl font-bold ${isDesignProject || isLumpSum ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{formatCurrency(contractValue)}</h3>
        </div>

        {/* 2. Received */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
          <div className="flex justify-between items-start mb-2"><p className="text-gray-500 dark:text-gray-400 text-sm font-bold">إجمالي الدفعات المستلمة</p><div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg"><TrendingUp size={18}/></div></div>
          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalReceived)}</h3>
        </div>

        {/* 3 & 4 */}
        {!isDesignProject && (
            <>
                <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                    <div className="flex justify-between items-start mb-2"><p className="text-gray-500 dark:text-gray-400 text-sm font-bold">إجمالي المصاريف</p><div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><TrendingDown size={18}/></div></div>
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalExpenses)}</h3>
                </div>
                <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
                    <div className="flex justify-between items-start mb-2"><p className="text-gray-500 dark:text-gray-400 text-sm font-bold">{isLumpSum ? 'صافي الربح المحقق' : 'نسبة الشركة المستحقة'}</p>{!isLumpSum && (<button onClick={() => setIsPercentModalOpen(true)} className="p-1.5 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 transition-colors"><Edit size={16} /></button>)}</div>
                    <h3 className={`text-2xl font-bold ${isLumpSum ? (profitDisplayValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-purple-600 dark:text-purple-400'}`}>{formatCurrency(profitDisplayValue)}</h3>
                </div>
            </>
        )}

        {/* 5. Remaining (Improved Logic) */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">المتبقي (رصيد المشروع)</p>
            <div className={`p-2 rounded-lg ${realWorkshopBalance >= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                {realWorkshopBalance >= 0 ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            </div>
          </div>
          <h3 className={`text-2xl font-bold ${realWorkshopBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(realWorkshopBalance)}
          </h3>
          <p className="text-[10px] text-gray-400 mt-1">
              إجمالي الدفعات - (المصاريف + النسبة)
          </p>
        </div>
      </div>

      {/* Tabs and Content (Preserved) */}
      <div className="space-y-4">
         <div className="flex flex-wrap bg-gray-100 dark:bg-dark-800 p-1 rounded-xl w-fit overflow-x-auto">
            <button onClick={() => setActiveTab('financials')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'financials' ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>السجل المالي</button>
            {!isDesignProject && (
                <>
                    <button onClick={() => setActiveTab('statement')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'statement' ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><ScrollText size={16} /> الكشف المؤقت</button>
                    <button onClick={() => setActiveTab('invoices')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'invoices' ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><Receipt size={16} /> الفواتير</button>
                    <button onClick={() => setActiveTab('team')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'team' ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>فريق العمل</button>
                    <button onClick={() => setActiveTab('agreements')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'agreements' ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><FileSignature size={16} /> الإتفاقيات والعقود</button>
                </>
            )}
            <button onClick={() => setActiveTab('notes')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'notes' ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><StickyNote size={16} /> الملاحظات</button>
         </div>

         {/* Content Area (Preserved) */}
         {activeTab === 'financials' && (
             <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 dark:border-dark-800">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Wallet className="text-primary-600 dark:text-primary-400" size={20} /> السجل المالي</h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                            <tr><th>التاريخ</th><th>النوع</th><th>الوصف</th><th>دائن (قبض)</th><th>مدين (صرف)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {ledgerData.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{row.date}</td>
                                    <td className="px-6 py-4">
                                        {row.rowType === 'invoice' ? <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">فاتورة</span> : 
                                         <span className={`text-[10px] px-2 py-0.5 rounded ${row.type === TransactionType.RECEIPT ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>{row.type}</span>}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{row.rowType === 'invoice' ? row.category : row.description}</td>
                                    <td className="px-6 py-4 text-green-600 dark:text-green-400 font-bold">{(row.rowType === 'receipt' || (row.rowType === 'payment' && row.type === TransactionType.RECEIPT)) ? formatCurrency(row.amount) : '-'}</td>
                                    <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-bold">{(row.rowType === 'invoice' || row.rowType === 'payment') ? formatCurrency(row.amount) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             </div>
         )}
         
         {/* ... (Other Tabs Content Preserved) ... */}
         {/* Use existing code for other tabs */}
         {activeTab === 'agreements' && !isDesignProject && (
             <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><FileSignature className="text-primary-600 dark:text-primary-400" size={20} /> العقود والاتفاقيات</h3>
                    <button onClick={() => setIsAgreementModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-700"><Plus size={16} /> إضافة عقد</button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                            <tr><th>العنوان</th><th>الطرف الثاني (الموظف)</th><th>التاريخ</th><th>المبلغ</th><th>النوع</th><th>الإجراءات</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {project.agreements?.map(agr => (
                                <tr key={agr.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{agr.title}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {employees.find(e => e.id === agr.employeeId)?.name || 'غير محدد'}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">{agr.date}</td>
                                    <td className="px-6 py-4 font-bold text-primary-700 dark:text-primary-400">{formatCurrency(agr.amount)}</td>
                                    <td className="px-6 py-4">
                                        {agr.type === 'text' ? (
                                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded flex items-center gap-1 w-fit"><AlignLeft size={12} /> عقد كتابي</span>
                                        ) : (
                                            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded flex items-center gap-1 w-fit"><File size={12} /> ملف مرفق</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {agr.type === 'text' ? (
                                            <button onClick={() => setViewAgreement(agr)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded" title="قراءة العقد"><Eye size={16} /></button>
                                        ) : (
                                            agr.attachmentUrl ? (
                                                <button onClick={() => window.open(agr.attachmentUrl, '_blank')} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded" title="تحميل الملف"><Upload size={16} /></button>
                                            ) : <span className="text-gray-300 text-xs">لا يوجد ملف</span>
                                        )}
                                        <button onClick={() => handleEditAgreement(agr)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 p-1.5 rounded"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteAgreement(agr.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {(!project.agreements || project.agreements.length === 0) && <tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد عقود مسجلة.</td></tr>}
                        </tbody>
                    </table>
                 </div>
             </div>
         )}
         
         {activeTab === 'statement' && !isDesignProject && (
             <div className="space-y-6">
                 {/* Main Statement Table */}
                 <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                     <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><ScrollText className="text-primary-600 dark:text-primary-400" size={20} /> الكشف المؤقت للأعمال الجارية</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">يتم تحديث "المصاريف المدفوعة" تلقائياً من الحركات المالية</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsColumnManagerOpen(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-gray-200 dark:border-dark-700"><Settings size={16} /> تخصيص الأعمدة</button>
                            <button onClick={() => openStatementRowModal()} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> إضافة بند جديد</button>
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">#</th>
                                    {statementColumns.map(col => (
                                        <th key={col.id} className="px-6 py-4 whitespace-nowrap">{col.label}</th>
                                    ))}
                                    <th className="px-6 py-4 w-20">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                                {(project.statementRows || []).map((row, idx) => {
                                    const calculatedPaid = calculatePaidAmount(row.id);
                                    // New logic for calculating 'Remaining' (formerly 'Expected')
                                    const agreedAmount = Number(row['agreed']) || 0;
                                    const remainingAmount = agreedAmount - calculatedPaid;

                                    return (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 group transition-colors">
                                        <td className="px-6 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                        {statementColumns.map(col => (
                                            <td key={col.id} className="px-6 py-4">
                                                {col.id === 'paid' ? (
                                                    <div className="flex flex-col"><span className="text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(calculatedPaid)}</span>{calculatedPaid > 0 && <span className="text-[9px] text-gray-400">تلقائي</span>}</div>
                                                ) : col.id === 'expected' ? (
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold ${remainingAmount < 0 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            {formatCurrency(remainingAmount)}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400">المتبقي</span>
                                                    </div>
                                                ) : col.type === 'number' ? (
                                                    <span className="text-gray-700 dark:text-gray-300">{row[col.id] ? formatCurrency(Number(row[col.id])) : '-'}</span>
                                                ) : (
                                                    <span className="text-gray-800 dark:text-white font-medium">{row[col.id]}</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openStatementRowModal(row)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteStatementRow(row.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                )})}
                                {(!project.statementRows || project.statementRows.length === 0) && (
                                    <tr><td colSpan={statementColumns.length + 2} className="text-center py-8 text-gray-400">لا توجد بنود في الكشف المؤقت. أضف بنوداً جديدة.</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-100 dark:bg-dark-800 font-bold text-gray-800 dark:text-white border-t border-gray-200 dark:border-dark-700">
                                <tr>
                                    <td className="px-6 py-4 text-center"></td>
                                    {statementColumns.map(col => {
                                        if (col.id === 'paid') {
                                            return <td key={col.id} className="px-6 py-4">{formatCurrency((project.statementRows || []).reduce((acc, row) => acc + calculatePaidAmount(row.id), 0))}</td>;
                                        } else if (col.id === 'expected') {
                                            // Calculate Total Remaining = Total Agreed - Total Paid
                                            const totalAgreed = (project.statementRows || []).reduce((acc, row) => acc + (Number(row['agreed']) || 0), 0);
                                            const totalPaid = (project.statementRows || []).reduce((acc, row) => acc + calculatePaidAmount(row.id), 0);
                                            return <td key={col.id} className="px-6 py-4">{formatCurrency(totalAgreed - totalPaid)}</td>;
                                        } else if (col.type === 'number') {
                                            return <td key={col.id} className="px-6 py-4">{formatCurrency((project.statementRows || []).reduce((acc, row) => acc + (Number(row[col.id]) || 0), 0))}</td>;
                                        } else if (col.id === statementColumns[0].id) {
                                            return <td key={col.id} className="px-6 py-4">الإجمالي</td>;
                                        }
                                        return <td key={col.id} className="px-6 py-4"></td>;
                                    })}
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                     </div>
                 </div>
                 {/* PROJECT INVOICES IN WORKSHOP (STATEMENT) TAB (Preserved) */}
                 <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                     <div className="p-6 border-b border-gray-100 dark:border-dark-800 bg-blue-50/30 dark:bg-blue-900/10">
                        <h3 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2"><FileText size={18} /> فواتير المشتريات المرتبطة بالمشروع (نسخة الورشة)</h3>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">رقم الفاتورة</th>
                                    <th className="px-6 py-3">المورد</th>
                                    <th className="px-6 py-3">التصنيف</th>
                                    <th className="px-6 py-3">التاريخ</th>
                                    <th className="px-6 py-3">الإجمالي</th>
                                    <th className="px-6 py-3">ظاهرة للعميل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                                {projectInvoices.length > 0 ? projectInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                                        <td className="px-6 py-3 font-mono font-bold text-gray-800 dark:text-gray-200">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{inv.supplierName}</td>
                                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{inv.category}</td>
                                        <td className="px-6 py-3 font-mono text-gray-500">{inv.date}</td>
                                        <td className="px-6 py-3 font-bold text-blue-600 dark:text-blue-400">{formatCurrency(inv.totalAmount)}</td>
                                        <td className="px-6 py-3">
                                            {inv.isClientVisible ? (
                                                <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-fit"><Eye size={12} /> نعم</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-400 text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded w-fit"><EyeOff size={12} /> لا</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="text-center py-6 text-gray-400">لا توجد فواتير مسجلة لهذا المشروع</td></tr>
                                )}
                            </tbody>
                        </table>
                     </div>
                 </div>
             </div>
         )}
         
         {activeTab === 'invoices' && !isDesignProject && (
             <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Receipt className="text-primary-600 dark:text-primary-400" size={20} /> فواتير المشتريات</h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">رقم الفاتورة</th>
                                <th className="px-6 py-4">المورد</th>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">التصنيف</th>
                                <th className="px-6 py-4">المبلغ</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">رؤية العميل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                            {projectInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-800 dark:text-gray-200">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inv.supplierName}</td>
                                    <td className="px-6 py-4 font-mono text-gray-500">{inv.date}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inv.category}</td>
                                    <td className="px-6 py-4 font-bold text-primary-700 dark:text-primary-400">{formatCurrency(inv.totalAmount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                            {inv.status === 'Paid' ? <CheckCircle size={12} /> : null}
                                            {inv.status === 'Paid' ? 'مدفوع' : 'مستحق'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {inv.isClientVisible ? (
                                            <span className="text-green-600 dark:text-green-400" title="ظاهرة للعميل"><Eye size={18}/></span>
                                        ) : (
                                            <span className="text-gray-300 dark:text-gray-600" title="مخفية"><EyeOff size={18}/></span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {projectInvoices.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-400">لا توجد فواتير مسجلة لهذا المشروع</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             </div>
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
                                 <span className="text-[10px] text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full">{note.date}</span>
                             </div>
                             <p className="text-gray-800 dark:text-gray-200 text-sm">{note.content}</p>
                         </div>
                     )) : <div className="text-center py-10 text-gray-400">لا توجد ملاحظات.</div>}
                 </div>
             </div>
         )}
         
         {/* ... Rest of components ... */}
      </div>

      {/* Fund Settings Modal */}
      <Modal isOpen={isFundSettingsModalOpen} onClose={() => setIsFundSettingsModalOpen(false)} title="إدارة صندوق الورشة">
          <form onSubmit={handleUpdateFundSettings} className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                      يستخدم صندوق الورشة للمصاريف اليومية والسريعة. الرصيد يتم حسابه تلقائياً (إجمالي المقبوضات - إجمالي المصروفات).
                  </p>
              </div>
              
              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الرصيد الحالي للصندوق</label>
                  <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-xl font-bold text-center bg-gray-100 dark:bg-dark-800 dark:text-white cursor-not-allowed"
                      value={formatCurrency(realWorkshopBalance)} 
                      readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">هذا الحقل تلقائي ولا يمكن تعديله يدوياً. لإضافة رصيد قم بتسجيل "سند قبض".</p>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">حد الأمان (نقطة الصفر - الإنذار)</label>
                  <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-red-200 dark:border-red-900/50 rounded-lg text-xl font-bold text-center text-red-600 bg-red-50 dark:bg-red-900/10"
                      value={workshopThreshold} 
                      onChange={(e) => setWorkshopThreshold(Number(e.target.value))} 
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">سيظهر تنبيه لك وللعميل عندما ينخفض الرصيد عن هذا المبلغ.</p>
              </div>

              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-primary-700 transition-colors">
                  حفظ الإعدادات
              </button>
          </form>
      </Modal>

      {/* ... (Rest of existing Modals for Statement, Agreements, etc. preserved) ... */}
      <Modal isOpen={isStatementRowModalOpen} onClose={() => setIsStatementRowModalOpen(false)} title={currentStatementRow.id ? "تعديل بند" : "إضافة بند جديد"}>
          <form onSubmit={handleSaveStatementRow} className="space-y-4">
              {statementColumns.map(col => (
                  <div key={col.id}>
                      <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{col.label}</label>
                      {col.id === 'paid' ? (
                          <div className="p-2 bg-gray-100 dark:bg-dark-800 rounded border border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 text-sm italic">
                              يتم حساب هذا الحقل تلقائياً من الحركات المالية المرتبطة.
                          </div>
                      ) : col.id === 'expected' ? (
                          <div className="p-2 bg-gray-100 dark:bg-dark-800 rounded border border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 text-sm italic">
                              يتم حساب هذا الحقل تلقائياً (المتفق عليه - المدفوع).
                          </div>
                      ) : col.type === 'number' ? (
                          <input type="number" className="w-full border border-gray-300 dark:border-dark-700 p-2 rounded bg-white dark:bg-dark-950 dark:text-white" value={currentStatementRow[col.id] || ''} onChange={e => setCurrentStatementRow({...currentStatementRow, [col.id]: Number(e.target.value)})} />
                      ) : (
                          <input type="text" className="w-full border border-gray-300 dark:border-dark-700 p-2 rounded bg-white dark:bg-dark-950 dark:text-white" value={currentStatementRow[col.id] || ''} onChange={e => setCurrentStatementRow({...currentStatementRow, [col.id]: e.target.value})} />
                      )}
                  </div>
              ))}
              <div className="pt-2">
                  <button className="w-full bg-primary-600 text-white font-bold p-3 rounded-lg hover:bg-primary-700">حفظ البند</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isColumnManagerOpen} onClose={() => setIsColumnManagerOpen(false)} title="تخصيص الأعمدة والتسميات">
          <div className="space-y-6">
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {statementColumns.map((col, index) => (
                      <div key={col.id} className="flex gap-2 items-center bg-gray-50 dark:bg-dark-800 p-2 rounded border border-gray-100 dark:border-dark-700">
                          <span className="text-gray-400 font-mono text-xs w-6 text-center">{index + 1}</span>
                          <input className="flex-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 p-2 rounded text-sm dark:text-white" value={col.label} onChange={(e) => handleRenameColumn(col.id, e.target.value)} disabled={col.id === 'paid'} />
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-dark-700 rounded text-gray-600 dark:text-gray-400">{col.type === 'number' ? 'رقم' : 'نص'}</span>
                          {col.id !== 'paid' && col.id !== 'item' && (<button onClick={() => handleRemoveColumn(col.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded" title="حذف العمود"><Trash2 size={16} /></button>)}
                      </div>
                  ))}
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-dark-700">
                  <h4 className="font-bold mb-2 text-sm text-gray-700 dark:text-gray-300">إضافة عمود جديد</h4>
                  <div className="flex gap-2">
                      <input placeholder="اسم العمود الجديد" className="flex-1 border border-gray-300 dark:border-dark-700 p-2 rounded bg-white dark:bg-dark-900 dark:text-white" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} />
                      <select className="border border-gray-300 dark:border-dark-700 p-2 rounded bg-white dark:bg-dark-900 dark:text-white" value={newColumnType} onChange={(e) => setNewColumnType(e.target.value as any)}><option value="text">نص</option><option value="number">رقم</option></select>
                      <button onClick={handleAddColumn} disabled={!newColumnName} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50"><PlusSquare size={18} /></button>
                  </div>
              </div>
              <button onClick={() => setIsColumnManagerOpen(false)} className="w-full bg-primary-600 text-white font-bold p-3 rounded-lg hover:bg-primary-700 mt-4">إغلاق وحفظ</button>
          </div>
      </Modal>

      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="تعديل القيمة">
          <form onSubmit={handleUpdateBudget} className="space-y-6">
              <div><input type="number" className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-xl font-bold text-center dark:bg-dark-950 dark:text-white" value={newBudget} onChange={(e) => setNewBudget(Number(e.target.value))} /></div>
              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2.5 rounded-lg">تحديث</button>
          </form>
      </Modal>
      
      <Modal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} title="تحديث الإنجاز">
          <form onSubmit={handleUpdateProgress} className="space-y-6">
              <div><input type="range" min="0" max="100" className="w-full h-3 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-600" value={newProgress} onChange={(e) => setNewProgress(Number(e.target.value))} /><div className="text-center font-bold mt-2 dark:text-white">{newProgress}%</div></div>
              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2.5 rounded-lg">حفظ</button>
          </form>
      </Modal>
      
      <Modal isOpen={isAgreementModalOpen} onClose={() => setIsAgreementModalOpen(false)} title={newAgreement.id ? "تعديل العقد" : "إضافة عقد جديد"}>
          <form onSubmit={handleSaveAgreement} className="space-y-4">
              <div className="bg-gray-50 dark:bg-dark-800 p-2 rounded-lg flex gap-2 mb-4">
                  <button type="button" onClick={() => setNewAgreement({...newAgreement, type: 'file'})} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${newAgreement.type === 'file' ? 'bg-white dark:bg-dark-600 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-700'}`}><Upload size={16} /> رفع ملف (PDF/صورة)</button>
                  <button type="button" onClick={() => setNewAgreement({...newAgreement, type: 'text'})} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${newAgreement.type === 'text' ? 'bg-white dark:bg-dark-600 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-700'}`}><AlignLeft size={16} /> عقد كتابي (نص)</button>
              </div>
              <div><label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">عنوان العقد</label><input required className="w-full border border-gray-300 dark:border-dark-700 p-2 rounded dark:bg-dark-950 dark:text-white" value={newAgreement.title} onChange={e => setNewAgreement({...newAgreement, title: e.target.value})} placeholder="مثال: عقد أعمال لياسة" /></div>
              <div><label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">القيمة المتفق عليها</label><input required type="number" className="w-full border border-gray-300 dark:border-dark-700 p-2 rounded dark:bg-dark-950 dark:text-white" value={newAgreement.amount} onChange={e => setNewAgreement({...newAgreement, amount: Number(e.target.value)})} /></div>
              <div><SearchableSelect label="الطرف الثاني (الموظف / المقاول)" options={employeeOptions} value={newAgreement.employeeId || ''} onChange={(val) => setNewAgreement({...newAgreement, employeeId: val})} placeholder="اختر الموظف..." /></div>
              {newAgreement.type === 'text' ? (
                  <div><label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">نص الاتفاقية / العقد</label><textarea className="w-full border border-gray-300 dark:border-dark-700 p-3 rounded h-40 dark:bg-dark-950 dark:text-white resize-none" placeholder="اكتب بنود العقد هنا..." value={newAgreement.content || ''} onChange={(e) => setNewAgreement({...newAgreement, content: e.target.value})} /></div>
              ) : (
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المرفق (ملف)</label><div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer relative transition-colors bg-gray-50 dark:bg-dark-900"><input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} /><Upload size={24} className="mb-2" />{newAgreement.attachmentUrl ? <span className="text-green-600 font-bold">تم اختيار الملف</span> : <span>اضغط لرفع الملف</span>}</div></div>
              )}
              <button className="w-full bg-primary-600 text-white p-2 rounded font-bold hover:bg-primary-700 transition-colors">حفظ العقد</button>
          </form>
      </Modal>

      <Modal isOpen={!!viewAgreement} onClose={() => setViewAgreement(null)} title={viewAgreement?.title || 'عرض العقد'}>
          <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-700 pb-2">
                  <span>التاريخ: {viewAgreement?.date}</span>
                  <span>الطرف الثاني: {employees.find(e => e.id === viewAgreement?.employeeId)?.name}</span>
              </div>
              <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700 min-h-[200px] whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                  {viewAgreement?.content || 'لا يوجد محتوى نصي.'}
              </div>
              <div className="flex justify-end">
                  <button onClick={() => setViewAgreement(null)} className="bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-lg font-bold">إغلاق</button>
              </div>
          </div>
      </Modal>

      <Modal isOpen={isEditNoteModalOpen} onClose={() => setIsEditNoteModalOpen(false)} title="تعديل الملاحظة">
          <form onSubmit={handleUpdateNote} className="space-y-4">
              <textarea className="w-full border border-gray-300 dark:border-dark-700 p-2 rounded h-32 dark:bg-dark-950 dark:text-white" value={editingNote?.content || ''} onChange={e => editingNote && setEditingNote({...editingNote, content: e.target.value})} />
              <button className="w-full bg-primary-600 text-white p-2 rounded">حفظ</button>
          </form>
      </Modal>

       <Modal isOpen={isPercentModalOpen} onClose={() => setIsPercentModalOpen(false)} title="تحديث نسبة الشركة">
          <form onSubmit={handleUpdatePercentage} className="space-y-6">
              <div><input type="number" className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-xl font-bold text-center dark:bg-dark-950 dark:text-white" value={newPercentage} onChange={(e) => setNewPercentage(Number(e.target.value))} /></div>
              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2.5 rounded-lg">حفظ</button>
          </form>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
