
import React, { useState } from 'react';
import { Investor, ProjectType, ProjectStatus, InvestorTransaction, Project } from '../types';
import { Search, UserPlus, Phone, Briefcase, TrendingUp, ChevronLeft, Key, Eye, EyeOff, Coins, HardHat } from 'lucide-react';
import { formatCurrency } from '../services/dataService';
import Modal from './Modal';
import InvestorDetails from './InvestorDetails';

interface InvestorsProps {
    investors: Investor[];
    onUpdateInvestors: (investors: Investor[]) => void;
    investorTransactions: InvestorTransaction[];
    onUpdateInvestorTransactions: (txns: InvestorTransaction[]) => void;
    projects: Project[];
}

const Investors: React.FC<InvestorsProps> = ({ investors, onUpdateInvestors, investorTransactions, onUpdateInvestorTransactions, projects }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  
  // Active Tab State
  const [activeTab, setActiveTab] = useState<'Capital' | 'Partner'>('Capital');

  // Visibility for credentials
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvestor, setNewInvestor] = useState<Partial<Investor>>({
    name: '',
    type: 'Capital',
    agreementDetails: '',
    phone: '',
    username: '',
    password: '',
    profitPercentage: 0,
    linkedProjectIds: []
  });

  // Calculate stats for an investor using dynamic props
  const getInvestorStats = (investorId: string) => {
      const txns = investorTransactions.filter(t => t.investorId === investorId);
      const capital = txns.filter(t => t.type === 'Capital_Injection').reduce((sum, t) => sum + t.amount, 0);
      const profit = txns.filter(t => t.type === 'Profit_Distribution').reduce((sum, t) => sum + t.amount, 0);
      const withdrawn = txns.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);
      const balance = (capital + profit) - withdrawn;
      return { capital, profit, withdrawn, balance };
  };

  const handleAddInvestor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestor.name) return;

    const investor: Investor = {
        id: `inv-${Date.now()}`,
        name: newInvestor.name,
        type: newInvestor.type || 'Capital',
        agreementDetails: newInvestor.agreementDetails || '',
        phone: newInvestor.phone || '',
        joinDate: new Date().toISOString().split('T')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newInvestor.name}`,
        username: newInvestor.username,
        password: newInvestor.password,
        profitPercentage: newInvestor.profitPercentage,
        linkedProjectIds: newInvestor.linkedProjectIds
    };

    onUpdateInvestors([...investors, investor]);
    setIsModalOpen(false);
    setNewInvestor({ name: '', type: 'Capital', agreementDetails: '', phone: '', username: '', password: '', profitPercentage: 0, linkedProjectIds: [] });
  };

  const updateInvestor = (updatedInvestor: Investor) => {
      onUpdateInvestors(investors.map(inv => inv.id === updatedInvestor.id ? updatedInvestor : inv));
      setSelectedInvestor(updatedInvestor); // Update current view
  };

  const togglePasswordVisibility = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredInvestors = investors.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || inv.phone.includes(searchTerm);
    const matchesTab = inv.type === activeTab;
    return matchesSearch && matchesTab;
  });

  // Get Execution Projects for Partner Selection
  const executionProjects = projects.filter(p => p.type === ProjectType.EXECUTION || p.status === ProjectStatus.EXECUTION);

  const toggleProjectLink = (projectId: string) => {
      const currentIds = newInvestor.linkedProjectIds || [];
      if (currentIds.includes(projectId)) {
          setNewInvestor({ ...newInvestor, linkedProjectIds: currentIds.filter(id => id !== projectId) });
      } else {
          setNewInvestor({ ...newInvestor, linkedProjectIds: [...currentIds, projectId] });
      }
  };

  // If an investor is selected, show details view
  if (selectedInvestor) {
      return (
        <InvestorDetails 
            investor={selectedInvestor} 
            onBack={() => setSelectedInvestor(null)} 
            onUpdateInvestor={updateInvestor}
            investorTransactions={investorTransactions}
            onUpdateInvestorTransactions={onUpdateInvestorTransactions}
            projects={projects}
        />
      );
  }

  return (
    <div className="space-y-6">
      {/* ... (Previous JSX for Header and Tabs remains similar, just ensuring no syntax errors) ... */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="text-purple-600" />
              المستثمرين والشركاء
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة رؤوس الأموال، الشراكات، وتوزيع الأرباح</p>
        </div>
        <button 
          onClick={() => {
              setNewInvestor({ ...newInvestor, type: activeTab }); 
              setIsModalOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-bold"
        >
          <UserPlus size={20} />
          <span>إضافة {activeTab === 'Capital' ? 'مستثمر مالي' : 'شريك بالجهد'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-100 dark:border-dark-800 flex overflow-x-auto gap-2">
         <button 
            onClick={() => setActiveTab('Capital')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Capital' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
            <Coins size={18} />
            مستثمر مالي (رأس مال)
         </button>
         <button 
            onClick={() => setActiveTab('Partner')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Partner' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
         >
            <HardHat size={18} />
            مستثمر بالجهد (شريك تنفيذي)
         </button>
      </div>

      <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:bg-dark-950 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvestors.map((investor) => {
            const stats = getInvestorStats(investor.id);
            return (
              <div 
                key={investor.id} 
                onClick={() => setSelectedInvestor(investor)}
                className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900 transition-all group cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={investor.avatar} alt={investor.name} className="w-14 h-14 rounded-full border-2 border-purple-50 dark:border-purple-900/30 object-cover" />
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-purple-600 transition-colors text-lg">{investor.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${investor.type === 'Capital' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                           {investor.type === 'Capital' ? 'مستثمر مالي' : 'شريك تنفيذي'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-50 dark:border-dark-800">
                    
                    {investor.type === 'Capital' ? (
                        <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/10 p-2 rounded">
                            <span className="text-xs text-purple-800 dark:text-purple-300 font-bold">نسبة الربح (السنوية/للمشروع):</span>
                            <span className="text-sm font-bold text-purple-700 dark:text-purple-400">{investor.profitPercentage || 0}%</span>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-2 rounded">
                            <span className="text-xs text-blue-800 dark:text-blue-300 font-bold">المشاريع المرتبطة:</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{investor.linkedProjectIds?.length || 0} مشاريع</span>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 h-8">
                        {investor.agreementDetails}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-gray-50 dark:bg-dark-800 p-2 rounded text-center">
                            <span className="block text-[10px] text-gray-500 dark:text-gray-400">رأس المال</span>
                            <span className="block font-bold text-sm text-gray-800 dark:text-white">{formatCurrency(stats.capital)}</span>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded text-center">
                            <span className="block text-[10px] text-green-600 dark:text-green-400">الأرباح الموزعة</span>
                            <span className="block font-bold text-sm text-green-700 dark:text-green-300">{formatCurrency(stats.profit)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <Phone size={14} />
                      <span dir="ltr">{investor.phone}</span>
                    </div>
                    
                    {(investor.username || investor.password) && (
                        <div className="bg-purple-50/50 dark:bg-purple-900/10 p-2 rounded-lg text-xs mt-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-purple-800 dark:text-purple-300 font-bold flex items-center gap-1"><Key size={10} /> بوابة المستثمر</span>
                                <button onClick={(e) => togglePasswordVisibility(investor.id, e)} className="text-purple-600 hover:text-purple-800 dark:text-purple-400">
                                    {showPasswordMap[investor.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">المستخدم:</span>
                                    <span className="font-mono font-bold select-all text-gray-700 dark:text-gray-300">{investor.username}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">كلمة المرور:</span>
                                    <span className="font-mono font-bold select-all text-gray-700 dark:text-gray-300">{showPasswordMap[investor.id] ? investor.password : '••••••'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/10 px-6 py-3 flex justify-between items-center border-t border-purple-100 dark:border-purple-900/30">
                    <span className="text-xs font-bold text-purple-800 dark:text-purple-300">عرض الصندوق وتوزيع الأرباح</span>
                    <ChevronLeft size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            );
        })}
        {filteredInvestors.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-600 bg-white dark:bg-dark-900 rounded-xl border border-dashed border-gray-200 dark:border-dark-700">
                <p>لا يوجد {activeTab === 'Capital' ? 'مستثمرين برأس مال' : 'شركاء بالجهد'} مسجلين</p>
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة مستثمر / شريك">
        <form onSubmit={handleAddInvestor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-dark-950 dark:text-white"
              value={newInvestor.name}
              onChange={(e) => setNewInvestor({...newInvestor, name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الشراكة</label>
                <select 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-dark-950 dark:text-white"
                    value={newInvestor.type}
                    onChange={(e) => setNewInvestor({...newInvestor, type: e.target.value as any})}
                >
                    <option value="Capital">مستثمر مالي (رأس مال)</option>
                    <option value="Partner">شريك بالجهد / تنفيذي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-dark-950 dark:text-white"
                  value={newInvestor.phone}
                  onChange={(e) => setNewInvestor({...newInvestor, phone: e.target.value})}
                />
              </div>
          </div>

          {newInvestor.type === 'Capital' ? (
              <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                  <label className="block text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">نسبة الربح من الشركة (%)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-dark-950 dark:text-white"
                    placeholder="مثال: 30"
                    value={newInvestor.profitPercentage}
                    onChange={(e) => setNewInvestor({...newInvestor, profitPercentage: Number(e.target.value)})}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">يحصل المستثمر المالي على هذه النسبة من صافي أرباح جميع مشاريع الشركة.</p>
              </div>
          ) : (
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">المشاريع التنفيذية المرتبطة (توزيع الأرباح منها فقط)</label>
                  <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar bg-white dark:bg-dark-950 p-2 rounded border border-blue-100 dark:border-blue-900">
                      {executionProjects.length > 0 ? executionProjects.map(proj => (
                          <label key={proj.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 dark:hover:bg-dark-800 rounded">
                              <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                  checked={newInvestor.linkedProjectIds?.includes(proj.id)}
                                  onChange={() => toggleProjectLink(proj.id)}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{proj.name}</span>
                          </label>
                      )) : <p className="text-xs text-gray-400 text-center">لا توجد مشاريع تنفيذية متاحة حالياً</p>}
                  </div>
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تفاصيل الاتفاقية (ملاحظات)</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-dark-950 dark:text-white"
              rows={2}
              placeholder="شروط إضافية، مدة العقد..."
              value={newInvestor.agreementDetails}
              onChange={(e) => setNewInvestor({...newInvestor, agreementDetails: e.target.value})}
            />
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
              <h4 className="font-bold text-purple-800 dark:text-purple-300 text-sm mb-3 flex items-center gap-2">
                  <Key size={14} /> بيانات دخول المستثمر (اختياري)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">اسم المستخدم</label>
                    <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg text-sm focus:outline-none dark:bg-dark-900 dark:text-white"
                        value={newInvestor.username}
                        onChange={(e) => setNewInvestor({...newInvestor, username: e.target.value})}
                        placeholder="مثال: inv_khalid"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">كلمة المرور</label>
                    <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg text-sm focus:outline-none dark:bg-dark-900 dark:text-white"
                        value={newInvestor.password}
                        onChange={(e) => setNewInvestor({...newInvestor, password: e.target.value})}
                        placeholder="••••••"
                    />
                  </div>
              </div>
          </div>
          
          <div className="pt-2 flex gap-3">
            <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg transition-colors">
              حفظ
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Investors;
