
import React, { useState } from 'react';
import { Client, AppDocument, User, ActivityLog } from '../types';
import { Search, UserPlus, Phone, Mail, Building, Key, Eye, EyeOff, Edit, Trash2, FolderOpen, Upload, Paperclip, FileText, X } from 'lucide-react';
import Modal from './Modal';

interface ClientsProps {
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
  onViewProjects: (client: Client) => void;
  currentUser?: User;
  onAction?: (action: ActivityLog['action'], entity: ActivityLog['entity'], description: string, entityId?: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, onUpdateClients, onViewProjects, currentUser, onAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({
    name: '',
    companyName: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    documents: []
  });

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!currentClient.name?.trim()) errors.push("اسم العميل مطلوب.");
    if (!currentClient.username?.trim()) errors.push("اسم المستخدم مطلوب للدخول للبوابة.");
    if (!currentClient.password?.trim()) errors.push("كلمة المرور مطلوبة.");
    
    if (errors.length > 0) {
        alert("تنبيه:\n" + errors.map(e => "• " + e).join("\n"));
        return;
    }

    if (isEditMode && currentClient.id) {
      onUpdateClients(clients.map(c => c.id === currentClient.id ? { ...c, ...currentClient } as Client : c));
      if (onAction) onAction('UPDATE', 'Client', `تعديل بيانات العميل: ${currentClient.name}`, currentClient.id);
    } else {
      const newClientData: Client = {
        ...currentClient,
        id: `c${Date.now()}`,
        joinDate: new Date().toISOString().split('T')[0],
        avatar: currentClient.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentClient.name}`
      } as Client;
      onUpdateClients([newClientData, ...clients]);
      if (onAction) onAction('CREATE', 'Client', `إضافة عميل جديد: ${newClientData.name}`, newClientData.id);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      const clientName = clients.find(c => c.id === id)?.name;
      onUpdateClients(clients.filter(c => c.id !== id));
      if (onAction) onAction('DELETE', 'Client', `حذف العميل: ${clientName || id}`, id);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setCurrentClient(client);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentClient({
      name: '',
      companyName: '',
      username: '',
      password: '',
      phone: '',
      email: '',
      documents: []
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setCurrentClient({ ...currentClient, avatar: imageUrl });
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc: AppDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.type.split('/')[1] || 'File',
        url: URL.createObjectURL(file),
        date: new Date().toISOString().split('T')[0]
      };
      setCurrentClient({
        ...currentClient,
        documents: [...(currentClient.documents || []), newDoc]
      });
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.includes(searchTerm) || 
    c.companyName?.includes(searchTerm) ||
    c.username.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة العملاء</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة بيانات العملاء وبيانات الدخول الخاصة بهم</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus size={20} />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث عن عميل باسمه أو اسم المستخدم..."
            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:bg-dark-950 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 hover:shadow-md transition-all group overflow-hidden">
            <div className="p-6 cursor-pointer" onClick={() => onViewProjects(client)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-full border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 object-cover" />
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{client.name}</h3>
                    {client.companyName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Building size={10} /> {client.companyName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-50 dark:border-dark-800">
                <div className="flex items-center justify-between text-sm" onClick={(e) => e.stopPropagation()}>
                   <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                     <Key size={14} />
                     <span>اسم المستخدم:</span>
                   </div>
                   <span className="font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-800 px-2 rounded">{client.username}</span>
                </div>

                <div className="flex items-center justify-between text-sm" onClick={(e) => e.stopPropagation()}>
                   <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                     <div onClick={() => togglePasswordVisibility(client.id)} className="cursor-pointer hover:text-primary-600 dark:hover:text-primary-400">
                        {showPasswordMap[client.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                     </div>
                     <span>كلمة المرور:</span>
                   </div>
                   <span className="font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-800 px-2 rounded min-w-[3rem] text-center">
                     {showPasswordMap[client.id] ? client.password : '•••••'}
                   </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <Phone size={14} />
                  <span>{client.phone}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-dark-800 p-3 border-t border-gray-100 dark:border-dark-700 flex justify-between items-center opacity-100 transition-opacity">
              <button onClick={() => onViewProjects(client)} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline px-2">عرض المشاريع</button>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); openEditModal(client); }} className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }} className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && <div className="col-span-full text-center text-gray-400 py-10">لا يوجد عملاء مسجلين</div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "تعديل بيانات العميل" : "إضافة عميل جديد"}>
        <form onSubmit={handleSaveClient} className="space-y-4">
          <div className="flex justify-center mb-6">
             <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full border-2 border-gray-200 dark:border-dark-700 overflow-hidden bg-gray-50 dark:bg-dark-800">
                   {currentClient.avatar ? <img src={currentClient.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><UserPlus size={32} /></div>}
                </div>
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Upload className="text-white" size={24} />
                </div>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarChange} />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم العميل الكامل</label>
              <input required type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white" value={currentClient.name} onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الشركة (اختياري)</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white" value={currentClient.companyName} onChange={(e) => setCurrentClient({...currentClient, companyName: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-dark-700">
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">اسم المستخدم</label>
              <input required type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm dark:bg-dark-950 dark:text-white" value={currentClient.username} onChange={(e) => setCurrentClient({...currentClient, username: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">كلمة المرور</label>
              <input required type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm dark:bg-dark-950 dark:text-white" value={currentClient.password} onChange={(e) => setCurrentClient({...currentClient, password: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white" value={currentClient.phone} onChange={(e) => setCurrentClient({...currentClient, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
              <input type="email" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-950 dark:text-white" value={currentClient.email} onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})} />
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors">حفظ البيانات</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clients;
