
import React, { useState, useMemo } from 'react';
import { Project, Transaction, Employee, Invoice, TransactionType, ProjectStatus, ProjectType } from '../types';
import { formatCurrency } from '../services/dataService';
import { 
  ArrowRight, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Users, 
  FileText, 
  Settings,
  MoreVertical,
  Plus,
  Trash2
} from 'lucide-react';
import Modal from './Modal';

interface ProjectDetailsProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onBack: () => void;
  employees?: Employee[];
  transactions?: Transaction[];
  projects?: Project[];
  onViewProject?: (project: Project) => void;
  invoices?: Invoice[];
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ 
    project, 
    onUpdateProject, 
    onDeleteProject, 
    onBack, 
    employees = [], 
    transactions = [], 
    projects = [], 
    onViewProject, 
    invoices = [] 
}) => {
  // Main View Tabs
  const [activeTab, setActiveTab] = useState<'financials' | 'team' | 'statement' | 'invoices'>('financials');
  
  // Data State - Filtered from props
  const projectInvoices = useMemo(() => invoices.filter(inv => inv.projectId === project.id), [invoices, project.id]);
  
  // CRITICAL FIX: Filter Transactions to USD ONLY for Project Accounting
  const projectTransactions = useMemo(() => transactions.filter(txn => txn.projectId === project.id && txn.currency !== 'SYP'), [transactions, project.id]);

  // Calculations
  const totalRevenue = projectTransactions.filter(t => t.type === TransactionType.RECEIPT).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = projectTransactions.filter(t => t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalRevenue - totalExpenses;

  // Percentage Completion
  const updateProgress = (newProgress: number) => {
      onUpdateProject({ ...project, progress: newProgress });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-800">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-full transition-colors">
                      <ArrowRight size={24} className="text-gray-600 dark:text-gray-300" />
                  </button>
                  <div>
                      <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          {project.name}
                          <span className={`text-xs px-2 py-1 rounded-full ${project.status === ProjectStatus.EXECUTION ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              {project.status}
                          </span>
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><MapPin size={14}/> {project.location}</span>
                          <span className="flex items-center gap-1"><Users size={14}/> {project.clientName}</span>
                          <span className="flex items-center gap-1"><Calendar size={14}/> {project.startDate}</span>
                      </div>
                  </div>
              </div>
              
              <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-dark-800">
                      <Settings size={20} />
                  </button>
                  <button className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDeleteProject && onDeleteProject(project.id)}>
                      <Trash2 size={20} />
                  </button>
              </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
              <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400 font-bold">نسبة الإنجاز</span>
                      <span className="font-bold text-primary-600">{project.progress}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={project.progress} 
                    onChange={(e) => updateProgress(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-800 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('financials')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'financials' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
              الملخص المالي
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'invoices' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
              الفواتير ({projectInvoices.length})
          </button>
          <button 
            onClick={() => setActiveTab('statement')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'statement' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
              كشف الحساب
          </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
          {activeTab === 'financials' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                      <p className="text-gray-500 text-sm font-bold">قيمة العقد / الميزانية</p>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{formatCurrency(project.budget)}</h3>
                  </div>
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                      <p className="text-gray-500 text-sm font-bold">إجمالي المقبوضات</p>
                      <h3 className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalRevenue)}</h3>
                  </div>
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                      <p className="text-gray-500 text-sm font-bold">إجمالي المصروفات</p>
                      <h3 className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalExpenses)}</h3>
                  </div>
              </div>
          )}

          {activeTab === 'invoices' && (
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                  <table className="w-full text-sm text-right">
                      <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500">
                          <tr>
                              <th className="px-6 py-3">رقم الفاتورة</th>
                              <th className="px-6 py-3">المورد</th>
                              <th className="px-6 py-3">المبلغ</th>
                              <th className="px-6 py-3">الحالة</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                          {projectInvoices.map(inv => (
                              <tr key={inv.id}>
                                  <td className="px-6 py-3 font-medium">{inv.invoiceNumber}</td>
                                  <td className="px-6 py-3">{inv.supplierName}</td>
                                  <td className="px-6 py-3 font-bold">{formatCurrency(inv.amount)}</td>
                                  <td className="px-6 py-3">
                                      <span className={`px-2 py-1 rounded text-xs ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                          {inv.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                          {projectInvoices.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">لا توجد فواتير</td></tr>}
                      </tbody>
                  </table>
              </div>
          )}

          {activeTab === 'statement' && (
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                  <table className="w-full text-sm text-right">
                      <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500">
                          <tr>
                              <th className="px-6 py-3">التاريخ</th>
                              <th className="px-6 py-3">البيان</th>
                              <th className="px-6 py-3">مدين (مصروف)</th>
                              <th className="px-6 py-3">دائن (مقبوض)</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                          {projectTransactions.map(txn => (
                              <tr key={txn.id}>
                                  <td className="px-6 py-3">{txn.date}</td>
                                  <td className="px-6 py-3">{txn.description}</td>
                                  <td className="px-6 py-3 text-red-600">{txn.type === TransactionType.PAYMENT ? formatCurrency(txn.amount) : '-'}</td>
                                  <td className="px-6 py-3 text-green-600">{txn.type === TransactionType.RECEIPT ? formatCurrency(txn.amount) : '-'}</td>
                              </tr>
                          ))}
                          {projectTransactions.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">لا توجد حركات</td></tr>}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
    </div>
  );
};

export default ProjectDetails;
