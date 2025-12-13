
import React, { useEffect, useState } from 'react';
import { Project, Client, ProjectStatus } from '../types';
import { formatCurrency } from '../services/dataService';
import { 
  ArrowRight, 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  Phone,
  Mail,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface ClientDetailsProps {
  client: Client;
  projects: Project[]; // Receive global projects state
  onBack: () => void;
  onViewProjectDetails: (project: Project) => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, projects, onBack, onViewProjectDetails }) => {
  const [clientProjects, setClientProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Filter projects for this specific client using the passed props (live data)
    const filtered = projects.filter(p => p.clientUsername === client.username);
    setClientProjects(filtered);
  }, [client, projects]);

  // Calculate Client Stats
  const totalBudget = clientProjects.reduce((acc, curr) => acc + curr.budget, 0);
  const totalPaid = clientProjects.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalRemaining = totalBudget - totalPaid; // Approximate for demo
  const activeProjectsCount = clientProjects.filter(p => p.status === ProjectStatus.EXECUTION || p.status === ProjectStatus.DESIGN).length;

  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.EXECUTION: return 'bg-blue-100 text-blue-700';
      case ProjectStatus.DESIGN: return 'bg-purple-100 text-purple-700';
      case ProjectStatus.DELIVERED: return 'bg-green-100 text-green-700';
      case ProjectStatus.DELAYED: return 'bg-red-100 text-red-700';
      case ProjectStatus.PROPOSED: return 'bg-yellow-100 text-yellow-700';
      case ProjectStatus.STOPPED: return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress > 50) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ملف العميل: {client.name}</h1>
          <p className="text-gray-500 text-sm flex items-center gap-3 mt-1">
             <span className="flex items-center gap-1"><Briefcase size={12}/> {client.companyName || 'حساب شخصي'}</span>
             <span className="flex items-center gap-1"><Phone size={12}/> {client.phone}</span>
             <span className="flex items-center gap-1"><Mail size={12}/> {client.email}</span>
          </p>
        </div>
      </div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 text-sm">إجمالي العقود</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={18}/></div>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{formatCurrency(totalBudget)}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 text-sm">المدفوعات المستلمة</p>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={18}/></div>
          </div>
          <h3 className="text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 text-sm">المتبقي (تقريبي)</p>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><PieChart size={18}/></div>
          </div>
          <h3 className="text-xl font-bold text-orange-700">{formatCurrency(totalRemaining)}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 text-sm">المشاريع النشطة</p>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Briefcase size={18}/></div>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{activeProjectsCount} <span className="text-xs font-normal text-gray-400">من أصل {clientProjects.length}</span></h3>
        </div>
      </div>

      {/* Projects List */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Briefcase size={20} className="text-gray-600"/>
          مشاريع العميل ({clientProjects.length})
        </h2>
        
        {clientProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientProjects.map((project) => (
              <div 
                key={project.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col relative overflow-hidden group cursor-pointer"
                onClick={() => onViewProjectDetails(project)}
              >
                <div className={`h-1.5 w-full ${getStatusColor(project.status).replace('text', 'bg').split(' ')[0]}`}></div>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <span className="text-xs font-mono text-gray-400">#{project.id}</span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-primary-600 transition-colors">{project.name}</h3>
                    {/* Always visible link icon */}
                    <ExternalLink size={16} className="text-gray-400 hover:text-primary-600" />
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{project.type}</p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      <span>{project.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{project.startDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg mt-2">
                      <span className="text-gray-500">قيمة العقد:</span>
                      <span className="font-bold text-gray-800">{formatCurrency(project.budget)}</span>
                    </div>
                  </div>

                  {project.status !== ProjectStatus.PROPOSED && (
                    <div className="mt-4">
                       <div className="flex justify-between text-xs mb-1">
                         <span className="text-gray-500">الإنجاز</span>
                         <span className="font-bold text-gray-800">{project.progress}%</span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-1.5">
                         <div 
                          className={`h-1.5 rounded-full ${getProgressColor(project.progress)}`} 
                          style={{ width: `${project.progress}%` }}
                         ></div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 rounded-xl border border-gray-200 border-dashed text-center">
             <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertCircle className="text-gray-400 w-8 h-8"/>
             </div>
             <h3 className="text-lg font-bold text-gray-700">لا توجد مشاريع</h3>
             <p className="text-gray-500">لا يوجد مشاريع مرتبطة بهذا العميل حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetails;
