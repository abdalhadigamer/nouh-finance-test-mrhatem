
import React, { useState } from 'react';
import { User, Client, Employee, Trustee, Investor, UserRole } from '../types';
import { Lock, User as UserIcon, ArrowRight, PenTool } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  clients: Client[];
  employees: Employee[];
  trustees: Trustee[];
  investors: Investor[];
  systemUsers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, clients, employees, trustees, investors, systemUsers }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // محاكاة تأخير الشبكة لإعطاء شعور بالمعالجة
    setTimeout(() => {
        // 1. البحث في مستخدمي النظام (إدارة، مالية، محاسبة)
        const systemUser = systemUsers.find(u => (u.email === username || u.name === username) && u.password === password);
        if (systemUser) {
            onLogin(systemUser);
            return;
        }

        // 2. البحث في العملاء
        const client = clients.find(c => c.username === username && c.password === password);
        if (client) {
            onLogin({
                id: client.id,
                name: client.name,
                role: UserRole.CLIENT,
                avatar: client.avatar || '',
                email: client.email,
                clientUsername: client.username
            });
            return;
        }

        // 3. البحث في الموظفين
        const emp = employees.find(e => e.username === username && e.password === password);
        if (emp) {
            onLogin({
                id: emp.id,
                name: emp.name,
                role: UserRole.EMPLOYEE,
                avatar: emp.avatar,
                email: emp.email,
                employeeId: emp.id
            });
            return;
        }

        // 4. البحث في أصحاب الأمانات
        const tr = trustees.find(t => t.username === username && t.password === password);
        if (tr) {
            onLogin({
                id: tr.id,
                name: tr.name,
                role: UserRole.TRUSTEE,
                avatar: tr.avatar || '',
                email: '',
                trusteeId: tr.id
            });
            return;
        }

        // 5. البحث في المستثمرين
        const inv = investors.find(i => i.username === username && i.password === password);
        if (inv) {
            onLogin({
                id: inv.id,
                name: inv.name,
                role: UserRole.INVESTOR,
                avatar: inv.avatar || '',
                email: '',
                investorId: inv.id
            });
            return;
        }

        // في حال عدم العثور على أي تطابق
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
        setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col justify-center items-center p-4 font-cairo text-right" dir="rtl">
      
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/30 rotate-3 transition-transform hover:rotate-0">
              <PenTool className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">وكالة نوح</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">للعمارة والتصميم والحلول الهندسية</p>
      </div>

      <div className="bg-white dark:bg-dark-900 w-full max-w-md rounded-3xl shadow-xl border border-gray-100 dark:border-dark-800 overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="p-8 md:p-10">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">تسجيل الدخول للنظام</h2>
              
              <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">اسم المستخدم</label>
                      <div className="relative group">
                          <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                          <input 
                            type="text" 
                            className="w-full pl-4 pr-12 py-3.5 border border-gray-200 dark:border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-950 dark:text-white transition-all bg-gray-50 dark:bg-dark-800 focus:bg-white dark:focus:bg-dark-950"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                          />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">كلمة المرور</label>
                      <div className="relative group">
                          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                          <input 
                            type="password" 
                            className="w-full pl-4 pr-12 py-3.5 border border-gray-200 dark:border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-950 dark:text-white transition-all bg-gray-50 dark:bg-dark-800 focus:bg-white dark:focus:bg-dark-950"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                      </div>
                  </div>

                  {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          {error}
                      </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                  >
                      {isLoading ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                          <>
                            <span>دخول</span>
                            <ArrowRight size={20} className="rtl:rotate-180" />
                          </>
                      )}
                  </button>
              </form>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-950/50 p-6 text-center border-t border-gray-100 dark:border-dark-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                  جميع الحقوق محفوظة © {new Date().getFullYear()} وكالة نوح للعمارة والتصميم
              </p>
          </div>
      </div>
    </div>
  );
};

export default Login;
