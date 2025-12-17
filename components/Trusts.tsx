
import React, { useState } from 'react';
import { Trustee, TrustTransaction } from '../types';
import { Search, UserPlus, Phone, Shield, ChevronLeft, Key, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../services/dataService';
import Modal from './Modal';
import TrustDetails from './TrustDetails';

interface TrustsProps {
    trustees: Trustee[];
    onUpdateTrustees: (trustees: Trustee[]) => void;
    trustTransactions: TrustTransaction[];
    onUpdateTrustTransactions: (txns: TrustTransaction[]) => void;
}

const Trusts: React.FC<TrustsProps> = ({ trustees, onUpdateTrustees, trustTransactions, onUpdateTrustTransactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrustee, setSelectedTrustee] = useState<Trustee | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrustee, setNewTrustee] = useState<Partial<Trustee>>({
    name: '',
    phone: '',
    relation: '',
    username: '',
    password: ''
  });

  // Calculate balance for a trustee dynamically from props
  const calculateBalance = (trusteeId: string) => {
      const txns = trustTransactions.filter(t => t.trusteeId === trusteeId);
      const deposits = txns.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = txns.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);
      return deposits - withdrawals;
  };

  const handleAddTrustee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrustee.name) return;

    const trustee: Trustee = {
        id: `tr-${Date.now()}`,
        name: newTrustee.name,
        phone: newTrustee.phone || '',
        relation: newTrustee.relation || 'صديق',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newTrustee.name}`,
        username: newTrustee.username,
        password: newTrustee.password
    };

    onUpdateTrustees([...trustees, trustee]);
    setIsModalOpen(false);
    setNewTrustee({ name: '', phone: '', relation: '', username: '', password: '' });
  };

  const togglePasswordVisibility = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTrustees = trustees.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.phone.includes(searchTerm)
  );

  // If a trustee is selected, show details view
  if (selectedTrustee) {
      return (
        <TrustDetails 
            trustee={selectedTrustee} 
            onBack={() => setSelectedTrustee(null)} 
            trustTransactions={trustTransactions}
            onUpdateTrustTransactions={onUpdateTrustTransactions}
        />
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Shield className="text-teal-600" />
              الأمانات والودائع
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة أموال الأقارب والأصدقاء المحفوظة لدي (صناديق خاصة)</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-bold"
        >
          <UserPlus size={20} />
          <span>إضافة شخص جديد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all dark:bg-dark-950 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Trustees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrustees.map((trustee) => {
            const balance = calculateBalance(trustee.id);
            const isDeficit = balance < 0;
            
            return (
              <div 
                key={trustee.id} 
                onClick={() => setSelectedTrustee(trustee)}
                className={`bg-white dark:bg-dark-900 rounded-xl shadow-sm border hover:shadow-md transition-all group cursor-pointer overflow-hidden ${isDeficit ? 'border-red-200 dark:border-red-900' : 'border-gray-100 dark:border-dark-800 hover:border-teal-200 dark:hover:border-teal-900'}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={trustee.avatar} alt={trustee.name} className={`w-14 h-14 rounded-full border-2 object-cover ${isDeficit ? 'border-red-100' : 'border-teal-50 dark:border-teal-900/30'}`} />
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-teal-600 transition-colors text-lg">{trustee.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                           {trustee.relation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-50 dark:border-dark-800">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <Phone size={14} />
                      <span dir="ltr">{trustee.phone}</span>
                    </div>
                    
                    {/* Credentials Display (Admin Only) */}
                    {(trustee.username || trustee.password) && (
                        <div className={`p-2 rounded-lg text-xs ${isDeficit ? 'bg-red-50 dark:bg-red-900/20' : 'bg-teal-50/50 dark:bg-teal-900/10'}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-bold flex items-center gap-1 ${isDeficit ? 'text-red-800 dark:text-red-300' : 'text-teal-800 dark:text-teal-300'}`}><Key size={10} /> بيانات الدخول</span>
                                <button onClick={(e) => togglePasswordVisibility(trustee.id, e)} className={`${isDeficit ? 'text-red-600' : 'text-teal-600'} hover:opacity-80`}>
                                    {showPasswordMap[trustee.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">المستخدم:</span>
                                    <span className="font-mono font-bold select-all text-gray-700 dark:text-gray-300">{trustee.username}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">كلمة المرور:</span>
                                    <span className="font-mono font-bold select-all text-gray-700 dark:text-gray-300">{showPasswordMap[trustee.id] ? trustee.password : '••••••'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`p-3 rounded-lg flex justify-between items-center mt-2 ${isDeficit ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-dark-800'}`}>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {isDeficit ? 'عجز (مكسور)' : 'رصيد الأمانة'}
                        </span>
                        <span className={`font-bold text-xl ${isDeficit ? 'text-red-600 dark:text-red-400' : 'text-teal-700 dark:text-teal-400'}`}>
                            {formatCurrency(balance)}
                        </span>
                    </div>
                  </div>
                </div>
                
                <div className={`px-6 py-3 flex justify-between items-center border-t ${isDeficit ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : 'bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30'}`}>
                    <span className={`text-xs font-bold ${isDeficit ? 'text-red-800 dark:text-red-300' : 'text-teal-800 dark:text-teal-300'}`}>عرض الصندوق والتفاصيل</span>
                    <ChevronLeft size={16} className={`${isDeficit ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'}`} />
                </div>
              </div>
            );
        })}
        {filteredTrustees.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-600 bg-white dark:bg-dark-900 rounded-xl border border-dashed border-gray-200 dark:border-dark-700">
                <p>لا يوجد أشخاص مسجلين</p>
            </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة شخص (صاحب أمانة)">
        <form onSubmit={handleAddTrustee} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none dark:bg-dark-950 dark:text-white"
              value={newTrustee.name}
              onChange={(e) => setNewTrustee({...newTrustee, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صلة القرابة / العلاقة</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none dark:bg-dark-950 dark:text-white"
              placeholder="مثال: خال، صديق، ابن عم..."
              value={newTrustee.relation}
              onChange={(e) => setNewTrustee({...newTrustee, relation: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none dark:bg-dark-950 dark:text-white"
              value={newTrustee.phone}
              onChange={(e) => setNewTrustee({...newTrustee, phone: e.target.value})}
            />
          </div>

          <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800">
              <h4 className="font-bold text-teal-800 dark:text-teal-300 text-sm mb-3 flex items-center gap-2">
                  <Key size={14} /> بيانات الدخول (اختياري)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">اسم المستخدم</label>
                    <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg text-sm focus:outline-none dark:bg-dark-900 dark:text-white"
                        value={newTrustee.username}
                        onChange={(e) => setNewTrustee({...newTrustee, username: e.target.value})}
                        placeholder="مثال: abu_ahmed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">كلمة المرور</label>
                    <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg text-sm focus:outline-none dark:bg-dark-900 dark:text-white"
                        value={newTrustee.password}
                        onChange={(e) => setNewTrustee({...newTrustee, password: e.target.value})}
                        placeholder="••••••"
                    />
                  </div>
              </div>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-2">
                  يمكن لصاحب الأمانة استخدام هذه البيانات للدخول والاطلاع على رصيده وكشف حسابه فقط.
              </p>
          </div>
          
          <div className="pt-2 flex gap-3">
            <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg transition-colors">
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

export default Trusts;
