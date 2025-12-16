
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../services/dataService';
import { Project, ProjectStatus, ProjectType, ContractType, User, Client, ActivityLog } from '../types';
import { Plus, Search, MapPin, DollarSign, Edit3, ArrowRightCircle, CheckCircle, Percent, Coins, Users, PenTool, Hammer, FileText, AlertCircle, ArrowDown, Trash2 } from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface ProjectsProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  onDeleteProject?: (projectId: string) => void; 
  onViewDetails?: (project: Project) => void;
  currentUser?: User;
  clients: Client[];
  onAction?: (action: ActivityLog['action'], entity: ActivityLog['entity'], description: string, entityId?: string) => void;
}

const Projects: React.FC<ProjectsProps> = ({ projects, onUpdateProjects, onDeleteProject, onViewDetails, currentUser, clients, onAction }) => {
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<ProjectStatus>(ProjectStatus.DESIGN);
  
  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Move Stage Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [projectToMove, setProjectToMove] = useState<Project | null>(null);
  const [targetStage, setTargetStage] = useState<ProjectStatus | ''>('');
  
  // Transition State (For Design -> Execution)
  const [transitionData, setTransitionData] = useState({
      newBudget: 0,
      newContractType: ContractType.PERCENTAGE,
      newPercentage: 0,
      resetFinancials: false
  });

  const [currentProject, setCurrentProject] = useState<Partial<Project>>({
    name: '',
    clientName: '',
    clientId: '',
    budget: 0,
    location: '',
    status: ProjectStatus.DESIGN,
    type: ProjectType.DESIGN,
    contractType: ContractType.PERCENTAGE,
    companyPercentage: 0,
    agreedLaborBudget: 0,
    startDate: new Date().toISOString().split('T')[0]
  });

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));

  const tabs = [
    { id: ProjectStatus.DESIGN, label: 'مرحلة التصميم', icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: ProjectStatus.EXECUTION, label: 'مرحلة التنفيذ', icon: Hammer, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: ProjectStatus.PROPOSED, label: 'مشاريع مقترحة', icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { id: ProjectStatus.STOPPED, label: 'مشاريع متوقفة', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { id: ProjectStatus.DELIVERED, label: 'تم التسليم', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  ];

  const openNewProjectModal = () => {
    setCurrentProject({
      name: '',
      clientName: '',
      clientId: '',
      budget: 0,
      location: '',
      status: activeTab === ProjectStatus.STOPPED ? ProjectStatus.DESIGN : activeTab, 
      type: activeTab === ProjectStatus.EXECUTION ? ProjectType.EXECUTION : ProjectType.DESIGN,
      contractType: ContractType.PERCENTAGE,
      companyPercentage: 0,
      agreedLaborBudget: 0,
      startDate: new Date().toISOString().split('T')[0]
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditProjectModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setCurrentProject(project);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
      e.stopPropagation();
      if (onDeleteProject) {
          onDeleteProject(projectId);
      }
  };

  const handleProjectClick = (project: Project) => {
    if (onViewDetails) {
        onViewDetails(project);
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: string[] = [];
    if (!currentProject.name?.trim()) errors.push("اسم المشروع مطلوب.");
    if (!currentProject.clientId) errors.push("يرجى اختيار العميل.");
    if (currentProject.status !== ProjectStatus.PROPOSED && (!currentProject.budget || currentProject.budget <= 0)) {
        errors.push("يرجى إدخال قيمة العقد (الميزانية) بشكل صحيح.");
    }
    
    if (errors.length > 0) {
        alert("تنبيه:\n" + errors.map(e => "• " + e).join("\n"));
        return;
    }

    let finalClientName = currentProject.clientName || 'عميل غير مسجل';
    let finalClientUsername = '';
    
    if (currentProject.clientId) {
       const selectedClient = clients.find(c => c.id === currentProject.clientId);
       if (selectedClient) {
           finalClientName = selectedClient.name;
           finalClientUsername = selectedClient.username;
       }
    }

    let finalType = currentProject.type || ProjectType.DESIGN;
    if (currentProject.status === ProjectStatus.EXECUTION) finalType = ProjectType.EXECUTION;

    if (isEditMode && currentProject.id) {
        const updatedProjects = projects.map(p => 
            p.id === currentProject.id ? { 
                ...p, 
                ...currentProject,
                type: finalType,
                clientName: finalClientName,
                clientUsername: finalClientUsername || p.clientUsername 
            } as Project : p
        );
        onUpdateProjects(updatedProjects);
        if (onAction) onAction('UPDATE', 'Project', `تحديث بيانات المشروع: ${currentProject.name}`, currentProject.id);
    } else {
        const project: Project = {
            ...currentProject as Project,
            id: `proj-${Date.now()}`,
            type: finalType,
            clientName: finalClientName,
            clientUsername: finalClientUsername,
            progress: 0,
            revenue: 0,
            expenses: 0
        };
        onUpdateProjects([project, ...projects]);
        if (onAction) onAction('CREATE', 'Project', `إنشاء مشروع جديد: ${project.name}`, project.id);
    }

    setIsModalOpen(false);
  };

  const openMoveStageModal = (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      setProjectToMove(project);
      setTargetStage(project.status); 
      setTransitionData({
          newBudget: 0,
          newContractType: ContractType.PERCENTAGE,
          newPercentage: 0,
          resetFinancials: false
      });
      setIsMoveModalOpen(true);
  };

  const handleConfirmMove = (e: React.FormEvent) => {
      e.preventDefault();
      if (!projectToMove || !targetStage) return;

      if (targetStage === projectToMove.status) {
          setIsMoveModalOpen(false);
          return;
      }

      if (projectToMove.status === ProjectStatus.DESIGN && targetStage === ProjectStatus.EXECUTION) {
          const alreadyMoved = projects.some(p => p.relatedProjectId === projectToMove.id && p.type === ProjectType.EXECUTION);
          if (alreadyMoved) {
              const existing = projects.find(p => p.relatedProjectId === projectToMove.id && p.type === ProjectType.EXECUTION);
              alert(`عذراً، لا يمكن تكرار النقل.\nهذا المشروع تم نقله سابقاً لمرحلة التنفيذ وهو موجود حالياً باسم: "${existing?.name}".`);
              setIsMoveModalOpen(false);
              return;
          }
      }

      if (targetStage === ProjectStatus.DELIVERED) {
          const remainingDebt = projectToMove.budget - projectToMove.revenue;
          if (remainingDebt > 0) {
              const confirmClose = window.confirm(
                  `تحذير: يوجد ذمم مالية غير محصلة لهذا المشروع بقيمة (${formatCurrency(remainingDebt)}).\n\n` +
                  `هل أنت متأكد من نقله إلى "تم التسليم" وإغلاقه؟\n` +
                  `يفضل تسوية الحسابات المالية أولاً.`
              );
              if (!confirmClose) return; 
          }
      }

      const isDesignToExecution = projectToMove.status === ProjectStatus.DESIGN && targetStage === ProjectStatus.EXECUTION;

      if (isDesignToExecution && transitionData.newBudget <= 0) {
          alert("يرجى إدخال قيمة عقد التنفيذ الجديد.");
          return;
      }

      let updatedProjects = [...projects];

      if (isDesignToExecution) {
          const designDebt = projectToMove.budget - projectToMove.revenue;
          const isFullyPaid = designDebt <= 0;

          if (isFullyPaid) {
              const archivedDesignProject: Project = {
                  ...projectToMove,
                  id: `arch-des-${Date.now()}`, 
                  name: `${projectToMove.name} (تصميم - أرشيف)`,
                  status: ProjectStatus.DELIVERED,
                  type: ProjectType.DESIGN,
              };

              const newExecutionProject: Project = {
                  ...projectToMove,
                  name: projectToMove.name,
                  status: ProjectStatus.EXECUTION,
                  type: ProjectType.EXECUTION,
                  budget: transitionData.newBudget,
                  revenue: 0, 
                  expenses: 0,
                  contractType: transitionData.newContractType,
                  companyPercentage: transitionData.newPercentage,
                  previousStageFees: projectToMove.budget, 
                  relatedProjectId: archivedDesignProject.id, 
                  workshopBalance: 0,
                  workshopThreshold: 1000,
                  progress: 0,
                  startDate: new Date().toISOString().split('T')[0] 
              };

              updatedProjects = projects.map(p => p.id === projectToMove.id ? newExecutionProject : p);
              updatedProjects.push(archivedDesignProject);

              if (onAction) onAction('UPDATE', 'Project', `تحويل المشروع ${projectToMove.name} للتنفيذ وأرشفة نسخة التصميم`, projectToMove.id);

          } else {
              const newExecutionProject: Project = {
                  ...projectToMove, 
                  id: `proj-exec-${Date.now()}`, 
                  name: `${projectToMove.name} (تنفيذ)`, 
                  status: ProjectStatus.EXECUTION,
                  type: ProjectType.EXECUTION,
                  budget: transitionData.newBudget,
                  revenue: 0,
                  expenses: 0,
                  contractType: transitionData.newContractType,
                  companyPercentage: transitionData.newPercentage,
                  previousStageFees: projectToMove.budget,
                  relatedProjectId: projectToMove.id, 
                  workshopBalance: 0,
                  workshopThreshold: 1000,
                  progress: 0,
                  startDate: new Date().toISOString().split('T')[0]
              };

              updatedProjects.push(newExecutionProject);
              
              alert(`تنبيه: يوجد ذمة مالية متبقية على مرحلة التصميم (${formatCurrency(designDebt)}).\n\nتم إبقاء مشروع التصميم نشطاً للمتابعة، وتم إنشاء مشروع جديد لمرحلة التنفيذ.`);
              
              if (onAction) onAction('CREATE', 'Project', `إنشاء مشروع تنفيذ جديد ${newExecutionProject.name} (التصميم لا يزال جاري/غير خالص)`, newExecutionProject.id);
          }

      } else {
          updatedProjects = projects.map(p => {
              if (p.id === projectToMove.id) {
                  return { ...p, status: targetStage as ProjectStatus };
              }
              return p;
          });
          if (onAction) onAction('UPDATE', 'Project', `نقل المشروع ${projectToMove.name} إلى ${targetStage}`, projectToMove.id);
      }

      onUpdateProjects(updatedProjects);
      setIsMoveModalOpen(false);
      setProjectToMove(null);
  };

  const filteredProjects = projects.filter(p => {
      const matchesFilter = p.name.includes(filter) || p.clientName.includes(filter) || p.location.includes(filter);
      if (activeTab === ProjectStatus.STOPPED) return matchesFilter && (p.status === ProjectStatus.STOPPED || p.status === ProjectStatus.DELAYED);
      return matchesFilter && p.status === activeTab;
  });

  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.EXECUTION: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case ProjectStatus.DESIGN: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case ProjectStatus.DELIVERED: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case ProjectStatus.DELAYED: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case ProjectStatus.STOPPED: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const showTransitionForm = projectToMove?.status === ProjectStatus.DESIGN && targetStage === ProjectStatus.EXECUTION;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة المشاريع</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">متابعة سير العمل والمراحل المختلفة للمشاريع</p>
        </div>
        <button onClick={openNewProjectModal} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
          <Plus size={20} /> <span className="font-bold">مشروع جديد</span>
        </button>
      </div>

      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto">
         {tabs.map(tab => {
             const Icon = tab.icon;
             const isActive = activeTab === tab.id;
             const count = projects.filter(p => {
                 if (tab.id === ProjectStatus.STOPPED) return p.status === ProjectStatus.STOPPED || p.status === ProjectStatus.DELAYED;
                 return p.status === tab.id;
             }).length;

             return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[140px] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isActive ? `${tab.bg} ${tab.color} ring-1 ring-inset ring-current` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}>
                    <Icon size={18} /> {tab.label}
                    <span className={`bg-white dark:bg-dark-950 px-1.5 py-0.5 rounded-md text-xs shadow-sm ${isActive ? tab.color : 'text-gray-400'}`}>{count}</span>
                </button>
             );
         })}
      </div>

      <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="بحث عن مشروع..." className="w-full pl-4 pr-10 py-3 border border-gray-200 dark:border-dark-700 rounded-xl outline-none dark:bg-dark-950 dark:text-white" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} onClick={() => handleProjectClick(project)} className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 hover:shadow-lg transition-all flex flex-col relative group cursor-pointer">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>{project.status === ProjectStatus.DELAYED ? 'مؤجل' : project.status}</span>
                  <div className="flex gap-1 z-10">
                       <button onClick={(e) => openMoveStageModal(e, project)} className="text-gray-400 hover:text-green-600 p-1.5" title="نقل لمرحلة أخرى"><ArrowRightCircle size={18} /></button>
                       <button onClick={(e) => openEditProjectModal(e, project)} className="text-gray-400 hover:text-primary-600 p-1.5" title="تعديل"><Edit3 size={18} /></button>
                       <button onClick={(e) => handleDeleteClick(e, project.id)} className="text-gray-400 hover:text-red-600 p-1.5" title="حذف المشروع"><Trash2 size={18} /></button>
                   </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{project.clientName}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><DollarSign size={16} /><span className="font-semibold">{formatCurrency(project.budget)}</span></div>
              </div>
            </div>
          ))}
          {filteredProjects.length === 0 && <div className="col-span-full py-20 text-center text-gray-400">لا توجد مشاريع في هذه المرحلة</div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "تعديل تفاصيل المشروع" : "إضافة مشروع جديد"}>
          <form onSubmit={handleSaveProject} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">اسم المشروع</label><input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" value={currentProject.name} onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><SearchableSelect label="العميل" options={clientOptions} value={currentProject.clientId || ''} onChange={(val) => { const selected = clients.find(c => c.id === val); setCurrentProject({ ...currentProject, clientId: val, clientName: selected ? selected.name : '' }); }} required /></div>
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">حالة المشروع</label>
                    <select 
                        required 
                        className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" 
                        value={currentProject.status} 
                        onChange={(e) => setCurrentProject({...currentProject, status: e.target.value as ProjectStatus})}
                    >
                        <option value={ProjectStatus.PROPOSED}>مقترح (دراسة)</option>
                        <option value={ProjectStatus.DESIGN}>مرحلة التصميم</option>
                        <option value={ProjectStatus.EXECUTION}>مرحلة التنفيذ</option>
                        <option value={ProjectStatus.STOPPED}>متوقف / مؤجل</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">قيمة العقد (الميزانية)</label>
                    <input 
                        type="number" 
                        className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" 
                        value={currentProject.budget} 
                        onChange={(e) => setCurrentProject({...currentProject, budget: Number(e.target.value)})} 
                        disabled={currentProject.status === ProjectStatus.PROPOSED}
                        placeholder={currentProject.status === ProjectStatus.PROPOSED ? 'غير محدد' : ''}
                    />
                </div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">الموقع</label><input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" value={currentProject.location} onChange={(e) => setCurrentProject({...currentProject, location: e.target.value})} /></div>
            </div>
            <div className="pt-4 flex gap-3"><button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-2.5 rounded-lg">حفظ</button><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-700 font-bold py-2.5 rounded-lg">إلغاء</button></div>
          </form>
      </Modal>

      <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title="نقل المشروع لمرحلة جديدة">
          <form onSubmit={handleConfirmMove} className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{projectToMove?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">الحالة الحالية: {projectToMove?.status}</p>
              </div>
              
              <div>
                  <label className="block text-sm font-bold mb-2 dark:text-gray-300">إلى المرحلة:</label>
                  <select 
                    className="w-full px-4 py-3 border rounded-lg dark:bg-dark-950 dark:text-white" 
                    value={targetStage} 
                    onChange={(e) => setTargetStage(e.target.value as ProjectStatus)}
                  >
                      <option value={ProjectStatus.DESIGN}>تصميم</option>
                      <option value={ProjectStatus.EXECUTION}>تنفيذ</option>
                      <option value={ProjectStatus.STOPPED}>متوقف / مؤجل</option>
                      <option value={ProjectStatus.DELIVERED}>تسليم (إغلاق)</option>
                  </select>
              </div>

              {/* TRANSITION DETAILS FORM */}
              {showTransitionForm && (
                  <div className="border-t border-gray-200 dark:border-dark-700 pt-4 mt-4 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-4">
                          <ArrowDown className="text-blue-600 animate-bounce" size={20} />
                          <h4 className="font-bold text-blue-800 dark:text-blue-300">بيانات عقد التنفيذ الجديد</h4>
                      </div>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-300 mb-4">
                          <strong>ملاحظة:</strong> سيتم أرشفة بيانات مرحلة التصميم وإنشاء بيانات مالية جديدة لمرحلة التنفيذ (تبدأ من الصفر).
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">قيمة عقد التنفيذ (الميزانية الجديدة)</label>
                              <input 
                                required
                                type="number" 
                                className="w-full px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-lg dark:bg-dark-950 dark:text-white font-bold" 
                                placeholder="مثال: 100,000"
                                value={transitionData.newBudget}
                                onChange={(e) => setTransitionData({...transitionData, newBudget: Number(e.target.value)})}
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">نوع العقد</label>
                                  <select 
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white"
                                    value={transitionData.newContractType}
                                    onChange={(e) => setTransitionData({...transitionData, newContractType: e.target.value as ContractType})}
                                  >
                                      <option value={ContractType.PERCENTAGE}>نسبة إشراف (Cost Plus)</option>
                                      <option value={ContractType.LUMP_SUM}>مقطوعية (Lump Sum)</option>
                                  </select>
                              </div>
                              {transitionData.newContractType === ContractType.PERCENTAGE && (
                                  <div>
                                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">نسبة الشركة %</label>
                                      <input 
                                        type="number" 
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-dark-950 dark:text-white" 
                                        placeholder="مثال: 15"
                                        value={transitionData.newPercentage}
                                        onChange={(e) => setTransitionData({...transitionData, newPercentage: Number(e.target.value)})}
                                      />
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}

              <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-2.5 rounded-lg hover:bg-primary-700">تأكيد النقل</button>
                  <button type="button" onClick={() => setIsMoveModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-200">إلغاء</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Projects;
