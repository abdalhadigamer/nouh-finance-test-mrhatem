
import React, { useState } from 'react';
import { Save, Bell, Lock, Globe, Shield, Users, Check, X, UserPlus, Edit, Trash2 } from 'lucide-react';
import { RolePermissions, UserRole, SystemModule, User, ActivityLog } from '../types';
import Modal from './Modal';

interface SettingsProps {
  permissions?: RolePermissions[];
  onUpdatePermissions?: (permissions: RolePermissions[]) => void;
  currentUser?: User;
  // New Props for User Management
  systemUsers?: User[];
  onUpdateSystemUsers?: (users: User[]) => void;
  onAction?: (action: ActivityLog['action'], entity: ActivityLog['entity'], description: string, entityId?: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ permissions = [], onUpdatePermissions, currentUser, systemUsers = [], onUpdateSystemUsers, onAction }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'permissions' | 'users'>('general');
  const [localPermissions, setLocalPermissions] = useState<RolePermissions[]>(permissions);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
      name: '',
      email: '', // Username
      password: '',
      role: UserRole.ACCOUNTANT
  });

  const togglePermission = (role: UserRole, module: SystemModule) => {
    setLocalPermissions(prev => prev.map(p => {
      if (p.role === role) {
        const canView = p.canView.includes(module) 
          ? p.canView.filter(m => m !== module) 
          : [...p.canView, module];
        return { ...p, canView };
      }
      return p;
    }));
  };

  const handleSavePermissions = () => {
    if (onUpdatePermissions) {
      onUpdatePermissions(localPermissions);
      if (onAction) {
          onAction('UPDATE', 'Settings', 'تحديث صلاحيات الأدوار والمستخدمين');
      }
      alert('تم تحديث الصلاحيات بنجاح');
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onUpdateSystemUsers) return;
      if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
          alert("يرجى تعبئة جميع الحقول المطلوبة.");
          return;
      }

      if (editingUser) {
          // Edit existing
          const updatedUsers = systemUsers.map(u => u.id === editingUser.id ? { ...u, ...newUser } as User : u);
          onUpdateSystemUsers(updatedUsers);
          if (onAction) onAction('UPDATE', 'Settings', `تعديل بيانات المستخدم: ${newUser.name}`, editingUser.id);
      } else {
          // Add new
          const userToAdd: User = {
              ...newUser as User,
              id: `usr-${Date.now()}`,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`
          };
          onUpdateSystemUsers([...systemUsers, userToAdd]);
          if (onAction) onAction('CREATE', 'Settings', `إضافة مستخدم جديد: ${userToAdd.name}`, userToAdd.id);
      }
      setIsUserModalOpen(false);
      resetUserForm();
  };

  const handleDeleteUser = (id: string) => {
      if (!onUpdateSystemUsers) return;
      if (confirm("هل أنت متأكد من حذف هذا المستخدم؟ لن يتمكن من الدخول للنظام بعد الآن.")) {
          const updatedUsers = systemUsers.filter(u => u.id !== id);
          onUpdateSystemUsers(updatedUsers);
          if (onAction) onAction('DELETE', 'Settings', `حذف مستخدم`, id);
      }
  };

  const openAddUser = () => {
      resetUserForm();
      setIsUserModalOpen(true);
  };

  const openEditUser = (user: User) => {
      setEditingUser(user);
      setNewUser(user);
      setIsUserModalOpen(true);
  };

  const resetUserForm = () => {
      setEditingUser(null);
      setNewUser({
          name: '',
          email: '',
          password: '',
          role: UserRole.ACCOUNTANT
      });
  };

  const modules: { id: SystemModule; label: string }[] = [
    { id: 'dashboard', label: 'لوحة التحكم' },
    { id: 'financial_stats', label: 'الإحصائيات المالية (الأرباح/الإيرادات)' },
    { id: 'projects', label: 'المشاريع' },
    { id: 'clients', label: 'العملاء' },
    { id: 'company_expenses', label: 'مصاريف الشركة' },
    { id: 'profit_loss', label: 'الأرباح والخسائر' },
    { id: 'investors', label: 'المستثمرين' },
    { id: 'trusts', label: 'الأمانات' },
    { id: 'invoices', label: 'الفواتير' },
    { id: 'transactions', label: 'الحركات المالية' },
    { id: 'reports', label: 'التقارير' },
    { id: 'hr', label: 'الموارد البشرية' },
    { id: 'files', label: 'الأرشيف' },
    { id: 'settings', label: 'الإعدادات' },
  ];

  const configurableRoles = [UserRole.FINANCE_MANAGER, UserRole.ACCOUNTANT, UserRole.ENGINEER, UserRole.PROCUREMENT];

  const availableRolesForUsers = [
      { value: UserRole.GENERAL_MANAGER, label: 'المدير العام' },
      { value: UserRole.FINANCE_MANAGER, label: 'المدير المالي' },
      { value: UserRole.ACCOUNTANT, label: 'المحاسب' },
      { value: UserRole.ENGINEER, label: 'مهندس / مشرف' },
      { value: UserRole.PROCUREMENT, label: 'مسؤول المشتريات' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الإعدادات</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">تخصيص النظام، الصلاحيات، وإدارة المستخدمين</p>
        </div>
        <div className="flex bg-white dark:bg-dark-900 rounded-lg p-1 border border-gray-200 dark:border-dark-700 overflow-x-auto">
           <button 
             onClick={() => setActiveTab('general')} 
             className={`px-4 py-2 text-sm font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
           >
             عام
           </button>
           <button 
             onClick={() => setActiveTab('users')} 
             className={`px-4 py-2 text-sm font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === 'users' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
           >
             المستخدمين والحسابات
           </button>
           <button 
             onClick={() => setActiveTab('permissions')} 
             className={`px-4 py-2 text-sm font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === 'permissions' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
           >
             صلاحيات الأدوار
           </button>
        </div>
      </div>

      {/* --- GENERAL TAB --- */}
      {activeTab === 'general' && (
        <div className="space-y-6 animate-in fade-in">
          {/* ... Existing General Settings Code ... */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-dark-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Globe size={20} className="text-primary-600" />
                إعدادات الشركة
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الشركة</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" defaultValue="بناء للحلول الهندسية" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني الرسمي</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" defaultValue="info@binaa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" defaultValue="+966 55 555 5555" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-950 dark:text-white" defaultValue="الرياض، المملكة العربية السعودية" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-primary-500/30 transition-all">
              <Save size={20} />
              حفظ التغييرات
            </button>
          </div>
        </div>
      )}

      {/* --- USERS MANAGEMENT TAB --- */}
      {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
                      <div>
                          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                              <Users size={20} className="text-primary-600" />
                              مستخدمو النظام
                          </h2>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">إضافة وحذف الحسابات الإدارية وتعيين كلمات المرور</p>
                      </div>
                      <button 
                        onClick={openAddUser}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-700 shadow-sm"
                      >
                          <UserPlus size={16} />
                          مستخدم جديد
                      </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                          <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                              <tr>
                                  <th className="px-6 py-4">الاسم</th>
                                  <th className="px-6 py-4">اسم المستخدم (للدخول)</th>
                                  <th className="px-6 py-4">كلمة المرور</th>
                                  <th className="px-6 py-4">الدور الوظيفي</th>
                                  <th className="px-6 py-4">إجراءات</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                              {systemUsers.map(user => (
                                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-dark-700" />
                                              <span className="font-bold text-gray-800 dark:text-white">{user.name}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{user.email}</td>
                                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 tracking-widest">••••••</td>
                                      <td className="px-6 py-4">
                                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold">
                                              {user.role}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 flex gap-2">
                                          <button 
                                            onClick={() => openEditUser(user)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-dark-700 rounded-lg transition-colors" 
                                            title="تعديل"
                                          >
                                              <Edit size={16} />
                                          </button>
                                          {/* Prevent deleting yourself if needed, but for now allow generic delete */}
                                          <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                            title="حذف"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {systemUsers.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">لا يوجد مستخدمين</td></tr>}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- PERMISSIONS TAB --- */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-dark-800 bg-blue-50/50 dark:bg-blue-900/10">
                 <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Shield size={20} />
                    مصفوفة الصلاحيات (Roles & Permissions)
                 </h2>
                 <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">تحكم دقيق في ما يمكن لكل دور وظيفي رؤيته والوصول إليه.</p>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead>
                       <tr className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700">
                          <th className="px-6 py-4 font-medium w-1/3">الوحدة / القسم</th>
                          {configurableRoles.map(role => (
                             <th key={role} className="px-6 py-4 font-bold text-center border-r border-gray-200 dark:border-dark-700">
                                <div className="flex flex-col items-center gap-1">
                                   <Users size={18} className="text-gray-400" />
                                   {role}
                                </div>
                             </th>
                          ))}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                       {modules.map(module => (
                          <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                             <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">
                                {module.label}
                                {module.id === 'financial_stats' && (
                                   <p className="text-xs text-gray-400 mt-1 font-normal">عرض الأرقام الحساسة في لوحة التحكم (مثل الأرباح)</p>
                                )}
                             </td>
                             {configurableRoles.map(role => {
                                const rolePerms = localPermissions.find(p => p.role === role);
                                const hasAccess = rolePerms?.canView.includes(module.id);
                                
                                return (
                                   <td key={role} className="px-6 py-4 text-center border-r border-gray-100 dark:border-dark-700">
                                      <button 
                                        onClick={() => togglePermission(role, module.id)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${hasAccess ? 'bg-green-500' : 'bg-gray-300 dark:bg-dark-600'}`}
                                      >
                                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${hasAccess ? 'translate-x-0' : '-translate-x-6'}`}></div>
                                      </button>
                                   </td>
                                );
                             })}
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="flex justify-end pt-4">
            <button 
              onClick={handleSavePermissions}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-green-500/30 transition-all"
            >
              <Save size={20} />
              حفظ تحديثات الصلاحيات
            </button>
          </div>
        </div>
      )}

      {/* User Add/Edit Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}>
          <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg dark:bg-dark-950 dark:text-white" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المستخدم (للدخول)</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg dark:bg-dark-950 dark:text-white" 
                        value={newUser.email} // Using email field as username/identifier
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="user@noah.com"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg dark:bg-dark-950 dark:text-white" 
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدور الوظيفي (يحدد الصلاحيات)</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg dark:bg-dark-950 dark:text-white"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  >
                      {availableRolesForUsers.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">يتم تحديد الصلاحيات بناءً على الدور المختار في تبويب "صلاحيات الأدوار".</p>
              </div>

              <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-2.5 rounded-lg hover:bg-primary-700">حفظ</button>
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg hover:bg-gray-200">إلغاء</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Settings;
