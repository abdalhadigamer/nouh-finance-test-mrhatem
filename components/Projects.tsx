
import React, { useState } from 'react';
import { formatCurrency } from '../services/dataService';
import { Project, ProjectStatus, ProjectType, ContractType } from '../types';
import { MOCK_CLIENTS } from '../constants';
import { Plus, Search, MapPin, Calendar, DollarSign, LayoutGrid, List, Edit3, ArrowRightCircle, CheckCircle, Percent, Coins, Users } from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface ProjectsProps {
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
  onViewDetails?: (project: Project) => void;
}

const Projects: React.FC<ProjectsProps> = ({ projects, onUpdateProjects, onViewDetails }) => {
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  
  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Move Stage Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [projectToMove, setProjectToMove] = useState<Project | null>(null);
  const [targetStage, setTargetStage] = useState<ProjectStatus | ''>('');

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

  // --- Handlers for Add/Edit Project ---

  const openNewProjectModal = () => {
    setCurrentProject({
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
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditProjectModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setCurrentProject(project);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleProjectClick = (project: Project) => {
    if (onViewDetails) {
        onViewDetails(project);
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalClientName = currentProject.clientName || 'عميل غير مسجل';
    let finalClientUsername = '';
    
    if (currentProject.clientId) {
       const selectedClient = MOCK_CLIENTS.find(c => c.id === currentProject.clientId);
       if (selectedClient) {
           finalClientName = selectedClient.name;
           finalClientUsername = selectedClient.username;
       }
    }

    // Default contract type if not set
    const finalContractType = currentProject.contractType || ContractType.PERCENTAGE;

    if (isEditMode && currentProject.id) {
        const updatedProjects = projects.map(p => 
            p.id === currentProject.id ? { 
                ...p, 
                ...currentProject, 
                contractType: finalContractType,
                clientName: finalClientName,
                clientUsername: finalClientUsername || p.clientUsername 
            } as Project : p
        );
        onUpdateProjects(updatedProjects);
    } else {
        const project: Project = {
            ...currentProject as Project,
            id: Math.floor(Math.random() * 10000).toString(),
            contractType: finalContractType,
            clientName: finalClientName,
            clientUsername: finalClientUsername,
            clientPassword: '123',
            progress: 0,
            revenue: 0,
            expenses: 0
        };
        onUpdateProjects([project, ...projects]);
    }

    setIsModalOpen(false);
  };

  // --- Handlers for Moving Stage (Manual Button) ---

  const openMoveStageModal = (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      setProjectToMove(project);
      setTargetStage(project.status); // Default to current
      setIsMoveModalOpen(true);
  };

  const handleConfirmMove = (e: React.FormEvent) => {
      e.preventDefault();
      if (!projectToMove || !targetStage) return;

      if (targetStage === projectToMove.status) {
          setIsMoveModalOpen(false);
          return;
      }

      const updatedProjects = projects.map(p => {
          if (p.id === projectToMove.id) {
              // Auto-Upgrade Logic: Design -> Execution
              // Automatically switch the project TYPE to unlock features
              if (p.status === ProjectStatus.DESIGN && targetStage === ProjectStatus.EXECUTION) {
                  return { 
                      ...p, 
                      status: targetStage, 
                      type: ProjectType.EXECUTION 
                  };
              }
              return { ...p, status: targetStage as ProjectStatus };
          }
          return p;
      });

      onUpdateProjects(updatedProjects);
      setIsMoveModalOpen(false);
      setProjectToMove(null);
  };

  // --- Render Helpers ---

  const filteredProjects = projects.filter(p => 
    p.name.includes(filter) || p.clientName.includes(filter) || p.location.includes(filter)
  );

  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.EXECUTION: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case ProjectStatus.DESIGN: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case ProjectStatus.DELIVERED: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case ProjectStatus.DELAYED: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case ProjectStatus.STOPPED: return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case ProjectStatus.PROPOSED: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const renderColumn = (title: string, status: ProjectStatus | 'OTHER', icon: React.ReactNode, count: number) => {
    const columnProjects = filteredProjects.filter(p => {
        if (status === 'OTHER') {
            return ![ProjectStatus.DESIGN, ProjectStatus.EXECUTION].includes(p.status);
        }
        return p.status === status;
    });

    return (
      <div className="bg-gray-50 dark:bg-dark-900 rounded-2xl p-4 flex flex-col h-full border border-gray-100 dark:border-dark-800 min-h-[300px]">
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
             {icon}
             {title}
           </h3>
           <span className="bg-white dark:bg-dark-800 px-2 py-1 rounded-md text-xs font-bold shadow-sm dark:text-gray-300">{count}</span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
           {columnProjects.map(project => (
             <div 
               key={project.id}
               onClick={() => handleProjectClick(project)}
               className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md cursor-pointer transition-all group relative"
             >
                <div className="flex justify-between items-start mb-2">
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(project.status)}`}>{project.status}</span>
                   <div className="flex gap-1 z-10">
                       <button 
                         onClick={(e) => openMoveStageModal(e, project)}
                         className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 p-1 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                         title="نقل المشروع لمرحلة أخرى"
                       >
                         <ArrowRightCircle size={16} />
                       </button>
                       <button 
                         onClick={(e) => openEditProjectModal(e, project)}
                         className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                         title="تعديل"
                       >
                         <Edit3 size={16} />
                       </button>
                   </div>
                </div>
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{project.name}</h4>
                <div className="flex justify-between items-center mb-3">
                   <p className="text-xs text-gray-500 dark:text-gray-400">{project.clientName}</p>
                   <span className="text-[10px] bg-gray-100 dark:bg-dark-900 px-1.5 rounded text-gray-500 dark:text-gray-400">{project.type}</span>
                </div>
                
                <div className="w-full bg-gray-100 dark:bg-dark-900 rounded-full h-1.5 mb-3">
                   <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-dark-700">
                   <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{formatCurrency(project.budget)}</span>
                   <div className="flex -space-x-2 space-x-reverse">
                      <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-dark-800">
                         {project.progress}%
                      </div>
                   </div>
                </div>
             </div>
           ))}
           {columnProjects.length === 0 && (
             <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm border-2 border-dashed border-gray-200 dark:border-dark-700 rounded-xl">
               لا توجد مشاريع
             </div>
           )}
        </div>
      </div>
    );
  };

  const clientOptions = MOCK_CLIENTS.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة المشاريع</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">لوحة التحكم بالمشاريع ومراحل التنفيذ</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white dark:bg-dark-900 p-1 rounded-lg border border-gray-200 dark:border-dark-800 flex">
             <button 
               onClick={() => setViewMode('list')}
               className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}
             >
               <List size={20} />
             </button>
             <button 
               onClick={() => setViewMode('board')}
               className={`p-2 rounded-md transition-colors ${viewMode === 'board' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}
             >
               <LayoutGrid size={20} />
             </button>
          </div>
          <button 
            onClick={openNewProjectModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/20"
          >
            <Plus size={20} />
            <span className="font-bold">مشروع جديد</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث عن مشروع، عميل، أو موقع..."
            className="w-full pl-4 pr-10 py-3 border border-gray-200 dark:border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-gray-50 dark:bg-dark-950 dark:text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
           {renderColumn('مرحلة التصميم', ProjectStatus.DESIGN, <div className="w-3 h-3 rounded-full bg-purple-500"></div>, filteredProjects.filter(p => p.status === ProjectStatus.DESIGN).length)}
           {renderColumn('قيد التنفيذ', ProjectStatus.EXECUTION, <div className="w-3 h-3 rounded-full bg-blue-500"></div>, filteredProjects.filter(p => p.status === ProjectStatus.EXECUTION).length)}
           {renderColumn('أخرى (منتهي/مؤجل)', 'OTHER', <div className="w-3 h-3 rounded-full bg-green-500"></div>, filteredProjects.filter(p => ![ProjectStatus.DESIGN, ProjectStatus.EXECUTION].includes(p.status)).length)}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div 
                key={project.id} 
                onClick={() => handleProjectClick(project)}
                className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 hover:shadow-lg dark:hover:border-primary-900/50 transition-all flex flex-col relative group cursor-pointer"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <div className="flex gap-1 z-10">
                       <button 
                         onClick={(e) => openMoveStageModal(e, project)}
                         className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                         title="نقل المشروع لمرحلة أخرى"
                       >
                         <ArrowRightCircle size={18} />
                       </button>
                       <button 
                         onClick={(e) => openEditProjectModal(e, project)}
                         className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                         title="تعديل"
                       >
                         <Edit3 size={18} />
                       </button>
                   </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{project.clientName}</p>
  
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(project.budget)}</span>
                  </div>
                </div>
  
                <div className="mt-6">
                   <div className="flex justify-between text-xs mb-1 text-gray-600 dark:text-gray-400">
                     <span>الإنجاز</span>
                     <span className="font-bold">{project.progress}%</span>
                   </div>
                   <div className="w-full bg-gray-100 dark:bg-dark-800 rounded-full h-2">
                     <div 
                      className="h-2 rounded-full bg-primary-600" 
                      style={{ width: `${project.progress}%` }}
                     ></div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "تعديل تفاصيل المشروع" : "إضافة مشروع جديد"}>
          <form onSubmit={handleSaveProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المشروع</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={currentProject.name}
                onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <SearchableSelect
                    label="العميل"
                    options={clientOptions}
                    value={currentProject.clientId || ''}
                    onChange={(val) => {
                        const selected = MOCK_CLIENTS.find(c => c.id === val);
                        setCurrentProject({
                            ...currentProject, 
                            clientId: val,
                            clientName: selected ? selected.name : ''
                        });
                    }}
                    required
                    placeholder="اختر العميل..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع المشروع</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    value={currentProject.type}
                    onChange={(e) => setCurrentProject({...currentProject, type: e.target.value as ProjectType})}
                  >
                    <option value={ProjectType.DESIGN}>مشروع تصميم</option>
                    <option value={ProjectType.EXECUTION}>مشروع تنفيذ/مقاولات</option>
                    <option value={ProjectType.SUPERVISION}>إشراف هندسي</option>
                    <option value={ProjectType.OTHER}>أخرى</option>
                  </select>
                </div>
            </div>

            {/* NEW: Contract Type & Pricing */}
            <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-dark-700 space-y-4">
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="contractType"
                            className="accent-primary-600 w-4 h-4"
                            checked={currentProject.contractType === ContractType.PERCENTAGE}
                            onChange={() => setCurrentProject({...currentProject, contractType: ContractType.PERCENTAGE})}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-bold flex items-center gap-1">
                            <Percent size={14} /> نسبة (Cost Plus)
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="contractType"
                            className="accent-primary-600 w-4 h-4"
                            checked={currentProject.contractType === ContractType.LUMP_SUM}
                            onChange={() => setCurrentProject({...currentProject, contractType: ContractType.LUMP_SUM})}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-bold flex items-center gap-1">
                            <Coins size={14} /> مقطوع (Lump Sum)
                        </span>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {currentProject.contractType === ContractType.LUMP_SUM ? 'قيمة العقد المتفق عليها (SAR)' : 'الميزانية التقديرية (SAR)'}
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        value={currentProject.budget}
                        onChange={(e) => setCurrentProject({...currentProject, budget: Number(e.target.value)})}
                      />
                    </div>
                    
                    {currentProject.contractType === ContractType.PERCENTAGE && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسبة الشركة %</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            value={currentProject.companyPercentage}
                            onChange={(e) => setCurrentProject({...currentProject, companyPercentage: Number(e.target.value)})}
                          />
                        </div>
                    )}
                </div>

                {/* Explicit Labor Budget for Lump Sum */}
                {currentProject.contractType === ContractType.LUMP_SUM && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                            <Users size={14} />
                            ميزانية الأجور المتفق عليها (للتثبيت)
                        </label>
                        <input 
                            type="number" 
                            className="w-full px-4 py-2 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={currentProject.agreedLaborBudget}
                            onChange={(e) => setCurrentProject({...currentProject, agreedLaborBudget: Number(e.target.value)})}
                            placeholder="حدد المبلغ المرصود لأجور العمالة"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            تحديد هذا المبلغ يساعد في مراقبة تكاليف العمالة ومنع تجاوزها للمتفق عليه في العقد المقطوع.
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ البدء</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    value={currentProject.startDate}
                    onChange={(e) => setCurrentProject({...currentProject, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الموقع</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 dark:bg-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    value={currentProject.location}
                    onChange={(e) => setCurrentProject({...currentProject, location: e.target.value})}
                  />
                </div>
            </div>
            
            {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسبة الإنجاز %</label>
                  <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="0" max="100" 
                        className="flex-1 h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
                        value={currentProject.progress}
                        onChange={(e) => setCurrentProject({...currentProject, progress: Number(e.target.value)})}
                      />
                      <span className="font-bold text-primary-600 w-10 text-center">{currentProject.progress}%</span>
                  </div>
                </div>
            )}

            <div className="pt-4 flex gap-3">
              <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors">
                {isEditMode ? 'حفظ التغييرات' : 'إنشاء المشروع'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors">
                إلغاء
              </button>
            </div>
          </form>
      </Modal>

      {/* Move Stage Modal */}
      <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title="نقل المشروع لمرحلة جديدة">
          <form onSubmit={handleConfirmMove} className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">المشروع الحالي</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{projectToMove?.name}</p>
                  <div className="flex justify-between items-center mt-2">
                     <p className="text-xs text-gray-500 dark:text-gray-400">الحالة الحالية: <span className="font-bold">{projectToMove?.status}</span></p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">النوع: <span className="font-bold">{projectToMove?.type}</span></p>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">إلى المرحلة:</label>
                  <select 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white"
                      value={targetStage}
                      onChange={(e) => setTargetStage(e.target.value as ProjectStatus)}
                  >
                      <option value={ProjectStatus.DESIGN}>مرحلة التصميم</option>
                      <option value={ProjectStatus.EXECUTION}>قيد التنفيذ</option>
                      <option value={ProjectStatus.DELIVERED}>تم التسليم</option>
                      <option value={ProjectStatus.DELAYED}>مؤجل</option>
                      <option value={ProjectStatus.STOPPED}>متوقف</option>
                  </select>
                  
                  {/* Auto-Upgrade Notice */}
                  {projectToMove?.status === ProjectStatus.DESIGN && targetStage === ProjectStatus.EXECUTION && (
                      <div className="mt-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 flex gap-2 items-start">
                          <CheckCircle className="text-green-600 w-5 h-5 flex-shrink-0" />
                          <p className="text-xs text-green-800 dark:text-green-300">
                              سيتم <strong>ترقية نوع المشروع</strong> تلقائياً إلى "تنفيذ" لفتح كافة التبويبات المالية والإدارية (فواتير، عمال، عقود) اللازمة لمرحلة التنفيذ.
                          </p>
                      </div>
                  )}
              </div>

              <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors">
                      تأكيد النقل
                  </button>
                  <button type="button" onClick={() => setIsMoveModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors">
                      إلغاء
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Projects;
