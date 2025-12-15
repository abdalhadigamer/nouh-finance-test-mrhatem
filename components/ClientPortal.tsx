
import React, { useEffect, useState, useRef } from 'react';
import { Project, Invoice, InvoiceType, ProjectStatus, ProjectType } from '../types';
import { MOCK_PROJECTS, MOCK_INVOICES } from '../constants';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  FileText, 
  Image, 
  Download,
  LogOut,
  Phone,
  Mail,
  ChevronLeft,
  ArrowRight,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  MessageCircle,
  Send,
  X,
  MessageSquare
} from 'lucide-react';
import { formatCurrency } from '../services/dataService';

interface ClientPortalProps {
  clientUsername: string;
  onLogout: () => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'admin';
  time: string;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ clientUsername, onLogout }) => {
  const [view, setView] = useState<'dashboard' | 'project_detail'>('dashboard');
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectInvoices, setProjectInvoices] = useState<Invoice[]>([]);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'مرحباً بك في وكالة نوح للعمارة والتصميم. كيف يمكننا خدمتك اليوم؟', sender: 'admin', time: '09:00' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch all projects associated with this username
    const foundProjects = MOCK_PROJECTS.filter(p => p.clientUsername === clientUsername);
    setMyProjects(foundProjects);
  }, [clientUsername]);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    // Filter invoices: Must be for this project, Purchase Type (as per previous instructions sales were removed, keeping legacy check just in case), AND VISIBLE TO CLIENT
    const relatedInvoices = MOCK_INVOICES.filter(inv => 
        inv.projectId === project.id && 
        inv.isClientVisible === true
    );
    setProjectInvoices(relatedInvoices);
    setView('project_detail');
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
    setView('dashboard');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, msg]);
    setNewMessage('');

    // Simulate auto-reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'r-' + Date.now(),
        text: 'شكراً لتواصلك معنا. تم استلام ملاحظتك وسيتم الرد عليك من قبل الفريق المختص في أقرب وقت.',
        sender: 'admin',
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.EXECUTION:
        return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> جاري التنفيذ</span>;
      case ProjectStatus.DESIGN:
        return <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Briefcase size={12} /> مرحلة التصميم</span>;
      case ProjectStatus.PROPOSED:
        return <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><FileText size={12} /> مقترح</span>;
      case ProjectStatus.STOPPED:
        return <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle size={12} /> متوقف</span>;
      case ProjectStatus.DELIVERED:
        return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> مكتمل</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold w-fit">{status}</span>;
    }
  };

  // --- Render Helpers ---
  
  const ChatWidget = () => (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 left-6 z-50 bg-primary-600 text-white p-4 rounded-full shadow-2xl hover:bg-primary-700 transition-transform hover:scale-110 flex items-center justify-center border-4 border-white dark:border-dark-900"
        title="محادثة فورية"
      >
        {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 md:w-96 bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-700 overflow-hidden flex flex-col max-h-[500px] h-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300 font-cairo text-right" dir="rtl">
           {/* Header */}
           <div className="bg-primary-900 p-4 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                 <div className="bg-white/10 p-2 rounded-full relative">
                    <MessageSquare size={20}/>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-primary-900 rounded-full"></span>
                 </div>
                 <div>
                    <h3 className="font-bold text-sm">المحادثات والملاحظات</h3>
                    <p className="text-[10px] text-primary-200">فريق الدعم الهندسي - متصل</p>
                 </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"><X size={18}/></button>
           </div>
           
           {/* Messages Area */}
           <div className="flex-1 bg-gray-50 dark:bg-dark-950 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')] dark:bg-none">
              <div className="text-center text-[10px] text-gray-400 my-2">اليوم</div>
              {messages.map(msg => (
                 <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm relative group ${msg.sender === 'me' ? 'bg-primary-600 text-white rounded-bl-none' : 'bg-white dark:bg-dark-800 text-gray-800 dark:text-white border border-gray-100 dark:border-dark-700 rounded-br-none'}`}>
                       <p className="leading-relaxed">{msg.text}</p>
                       <span className={`text-[9px] block mt-1 text-right ${msg.sender === 'me' ? 'text-primary-100' : 'text-gray-400'}`}>{msg.time}</span>
                    </div>
                 </div>
              ))}
              <div ref={chatEndRef}></div>
           </div>

           {/* Input Area */}
           <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800 flex gap-2 items-end">
              <textarea 
                 className="flex-1 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none max-h-24 custom-scrollbar dark:text-white"
                 placeholder="اكتب ملاحظاتك أو استفسارك هنا..."
                 rows={1}
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSendMessage(e);
                   }
                 }}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                 <Send size={18} className={newMessage.trim() ? '' : 'opacity-80'} />
              </button>
           </form>
        </div>
      )}
    </>
  );

  // --- View: Dashboard (All Projects) ---
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 font-cairo text-right transition-colors" dir="rtl">
        {/* Header */}
        <header className="bg-primary-900 text-white shadow-lg sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">بوابة العميل</h1>
                <p className="text-xs text-primary-200">مرحباً بك، {myProjects[0]?.clientName || 'عزيزي العميل'}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-red-500/20"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">تسجيل خروج</span>
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">مشاريعي</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">قائمة بجميع المشاريع الخاصة بك وحالتها الحالية</p>
             </div>
             <div className="bg-white dark:bg-dark-900 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-dark-800 text-sm font-bold text-gray-600 dark:text-gray-300">
                عدد المشاريع: {myProjects.length}
             </div>
           </div>

           {myProjects.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-dark-900 rounded-3xl shadow-sm border border-gray-200 dark:border-dark-800">
                <div className="bg-gray-50 dark:bg-dark-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="text-gray-400 dark:text-gray-500 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">لا توجد مشاريع حالياً</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">لم يتم ربط أي مشاريع بحسابك بعد. يرجى التواصل مع الإدارة.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map(project => (
                  <div 
                    key={project.id} 
                    onClick={() => handleOpenProject(project)}
                    className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-900 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full overflow-hidden"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        {getStatusBadge(project.status)}
                        <span className="text-xs text-gray-400 font-mono bg-gray-50 dark:bg-dark-800 px-2 py-1 rounded">#{project.id}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {project.name}
                      </h3>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{project.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                          <span>تاريخ البدء: {project.startDate}</span>
                        </div>
                      </div>

                      {project.status !== ProjectStatus.PROPOSED && (
                        <div className="mt-6">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500 dark:text-gray-400 font-bold">نسبة الإنجاز</span>
                            <span className="font-bold text-primary-700 dark:text-primary-400">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-dark-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${project.status === ProjectStatus.STOPPED ? 'bg-red-400' : 'bg-primary-500'}`} 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-800 border-t border-gray-100 dark:border-dark-700 flex justify-between items-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-bold group-hover:text-primary-700 dark:group-hover:text-primary-300">عرض التفاصيل والملفات</span>
                      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-full text-gray-400 group-hover:text-primary-600 shadow-sm transition-colors">
                        <ChevronLeft size={16} />
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </main>
        <ChatWidget />
      </div>
    );
  }

  // --- View: Project Detail ---
  if (view === 'project_detail' && selectedProject) {
    const isFundLow = (selectedProject.workshopBalance !== undefined) && 
                      (selectedProject.workshopThreshold !== undefined) && 
                      (selectedProject.workshopBalance <= selectedProject.workshopThreshold) &&
                      selectedProject.type === ProjectType.EXECUTION;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 font-cairo text-right transition-colors" dir="rtl">
        {/* Header */}
        <header className="bg-primary-900 text-white shadow-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBackToDashboard}
                className="hover:bg-white/10 p-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowRight size={20} />
                <span className="text-sm font-bold hidden sm:inline">عودة للقائمة</span>
              </button>
              <div className="h-6 w-px bg-white/20 mx-2 hidden sm:block"></div>
              <div>
                <h1 className="text-lg font-bold truncate max-w-[200px] sm:max-w-md">{selectedProject.name}</h1>
                <p className="text-xs text-primary-200 flex items-center gap-1">
                  <MapPin size={10} /> {selectedProject.location}
                </p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-red-500/20"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* IMPORTANT: Fund Low Alert Banner */}
          {isFundLow && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400">
                          <AlertTriangle size={32} />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-red-800 dark:text-red-300">تنبيه هام: رصيد المشروع منخفض</h3>
                          <p className="text-red-700 dark:text-red-400 mt-1">
                              الرصيد المخصص لمصاريف الورشة وصل للحد الأدنى. يرجى المبادرة بدفع دفعة جديدة لضمان استمرارية العمل في الموقع دون توقف.
                          </p>
                      </div>
                  </div>
                  <a 
                    href="tel:+966555555555"
                    className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 whitespace-nowrap flex items-center gap-2"
                  >
                      <Phone size={18} />
                      تواصل مع الإدارة للدفع
                  </a>
              </div>
          )}

          {/* Project Status Banner */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
            <div className={`p-8 text-white relative overflow-hidden ${
              selectedProject.status === ProjectStatus.STOPPED ? 'bg-gradient-to-l from-red-600 to-red-800' :
              selectedProject.status === ProjectStatus.PROPOSED ? 'bg-gradient-to-l from-yellow-500 to-yellow-700' :
              'bg-gradient-to-l from-primary-600 to-primary-800'
            }`}>
              {/* Background Pattern */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block border border-white/30 backdrop-blur-sm">
                    {selectedProject.type}
                  </span>
                  <h2 className="text-3xl font-bold mb-2">{selectedProject.name}</h2>
                  <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
                    <span className="flex items-center gap-1"><Calendar size={14} /> تاريخ البدء: {selectedProject.startDate}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{selectedProject.status}</span>
                  </div>
                </div>
                {selectedProject.status !== ProjectStatus.PROPOSED && (
                  <div className="text-left bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 w-full md:w-auto shadow-lg">
                    <p className="text-xs text-white/80 mb-1 font-bold">نسبة الإنجاز</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold">{selectedProject.progress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {selectedProject.status !== ProjectStatus.PROPOSED && (
              <div className="p-8">
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 dark:bg-dark-800 rounded-full h-4 mb-8 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${selectedProject.status === ProjectStatus.STOPPED ? 'bg-red-500' : 'bg-primary-600'}`}
                    style={{ width: `${selectedProject.progress}%` }}
                  ></div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 font-bold">قيمة العقد التقريبية</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(selectedProject.budget * 1.2)}</p> 
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900/30">
                    <p className="text-green-600 dark:text-green-400 text-sm mb-1 font-bold">إجمالي المدفوع</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(selectedProject.revenue)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-blue-600 dark:text-blue-400 text-sm mb-1 font-bold">المتبقي للدفع</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency((selectedProject.budget * 1.2) - selectedProject.revenue)}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedProject.status === ProjectStatus.PROPOSED && (
               <div className="p-8 text-center bg-yellow-50 dark:bg-yellow-900/20">
                  <h3 className="text-yellow-800 dark:text-yellow-300 font-bold text-lg">هذا المشروع مقترح</h3>
                  <p className="text-yellow-700 dark:text-yellow-400 mt-2">المشروع حالياً في مرحلة الدراسة والموافقة. سيتم تحديث البيانات المالية ونسب الإنجاز فور الاعتماد.</p>
               </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoices Section */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="text-primary-600 dark:text-primary-400" />
                الدفعات المالية والفواتير
              </h3>
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-dark-700">
                      <tr>
                        <th className="px-6 py-4">رقم الفاتورة</th>
                        <th className="px-6 py-4">البيان</th>
                        <th className="px-6 py-4">التاريخ</th>
                        <th className="px-6 py-4">المبلغ</th>
                        <th className="px-6 py-4">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                      {projectInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inv.category}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono">{inv.date}</td>
                          <td className="px-6 py-4 font-bold text-primary-700 dark:text-primary-400">{formatCurrency(inv.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                              {inv.status === 'Paid' ? <CheckCircle size={12} /> : null}
                              {inv.status === 'Paid' ? 'مدفوع' : 'مستحق'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {projectInvoices.length === 0 && (
                        <tr><td colSpan={5} className="p-10 text-center text-gray-400 dark:text-gray-500">لا توجد فواتير مسجلة لهذا المشروع</td></tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </div>

            {/* Files & Help Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Image className="text-primary-600 dark:text-primary-400" />
                ألبوم المشروع والمرفقات
              </h3>
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border border-gray-100 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-800 hover:border-primary-200 dark:hover:border-primary-900 transition-all cursor-pointer group">
                      <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">ملف العقد.pdf</p>
                        <p className="text-xs text-gray-400">2.4 MB • تم الرفع</p>
                      </div>
                      <Download size={20} className="text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    </div>

                    <div className="flex items-center gap-3 p-3 border border-gray-100 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-800 hover:border-primary-200 dark:hover:border-primary-900 transition-all cursor-pointer group">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Image size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">المخططات الهندسية</p>
                        <p className="text-xs text-gray-400">15 MB • تم الرفع</p>
                      </div>
                      <Download size={20} className="text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                  <button 
                    onClick={() => alert("سيتم فتح معرض الملفات قريباً")}
                    className="w-full mt-4 text-primary-600 dark:text-primary-400 text-sm font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 py-2 rounded-lg transition-colors"
                  >
                    عرض كل الملفات
                  </button>
              </div>

              <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl p-6 border border-primary-100 dark:border-primary-900/30">
                  <h4 className="font-bold text-primary-900 dark:text-primary-300 mb-2 text-lg">هل تحتاج مساعدة؟</h4>
                  <p className="text-sm text-primary-700 dark:text-primary-400 mb-4">فريقنا الهندسي جاهز للإجابة على استفساراتك.</p>
                  <div className="space-y-3">
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 p-3 rounded-xl w-full border border-primary-100 dark:border-dark-700 hover:border-primary-300 hover:shadow-md transition-all"
                    >
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
                            <MessageCircle size={18} />
                        </div>
                        <span>محادثة فورية / إرسال ملاحظة</span>
                    </button>
                    <a 
                        href="tel:+966555555555" 
                        className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 p-3 rounded-xl w-full border border-primary-100 dark:border-dark-700 hover:border-primary-300 hover:shadow-md transition-all"
                    >
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
                            <Phone size={18} />
                        </div>
                        <span>اتصال بالمهندس المشرف</span>
                    </a>
                    <a 
                        href="mailto:support@noah.com"
                        className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 p-3 rounded-xl w-full border border-primary-100 dark:border-dark-700 hover:border-primary-300 hover:shadow-md transition-all"
                    >
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
                            <Mail size={18} />
                        </div>
                        <span>إرسال بريد إلكتروني</span>
                    </a>
                  </div>
              </div>
            </div>
          </div>
        </main>
        <ChatWidget />
      </div>
    );
  }

  return <div className="flex items-center justify-center min-h-screen text-gray-500">جار التحميل...</div>;
};

export default ClientPortal;
