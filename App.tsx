
import React, { useState, useEffect } from 'react';
import Layout, { SearchResultItem } from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails'; 
import Transactions from './components/Transactions';
import TransactionsSYP from './components/TransactionsSYP'; 
import Invoices from './components/Invoices';
import Settings from './components/Settings';
import ClientPortal from './components/ClientPortal';
import Clients from './components/Clients';
import ClientDetails from './components/ClientDetails';
import HR from './components/HR';
import Reports from './components/Reports';
import EmployeePortal from './components/EmployeePortal'; 
import ManagerReports from './components/ManagerReports';
import Files from './components/Files'; 
import Notifications from './components/Notifications';
import Messages from './components/Messages'; 
import CompanyExpenses from './components/CompanyExpenses'; 
import Trusts from './components/Trusts'; 
import Investors from './components/Investors'; 
import TrusteePortal from './components/TrusteePortal'; 
import InvestorPortal from './components/InvestorPortal'; 
import ProfitLoss from './components/ProfitLoss'; 
import ActivityLogs from './components/ActivityLogs'; 
import AIAssistant from './components/AIAssistant'; // IMPORT AI COMPONENT
import { MOCK_USERS, LOGO_URL, DEFAULT_PERMISSIONS, MOCK_ACTIVITY_LOGS } from './constants';
import { User, UserRole, Client, Employee, Project, Trustee, Investor, RolePermissions, SystemModule, Invoice, Transaction, TransactionType, ActivityLog, TrustTransaction, InvestorTransaction } from './types';

// Helper Hook for Persistent State
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  }, [key, state]);

  return [state, setState];
}

const LoginScreen = ({ onLogin }: { onLogin: (emailOrUsername: string, password?: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    } else {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
             <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-primary-900 font-cairo mb-2">وكالة نوح</h1>
          <p className="text-gray-500 text-sm">للعمارة والتصميم</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold">{error}</div>}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="name@noah.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
            <input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">تسجيل الدخول</button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-[10px] text-gray-400 space-y-1">
          <p>للتجربة: admin@noah.com / 123456</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // --- GLOBAL PERSISTENT STATE ---
  const [systemUsers, setSystemUsers] = usePersistentState<User[]>('systemUsers', MOCK_USERS);
  const [projects, setProjects] = usePersistentState<Project[]>('projects', []);
  const [clients, setClients] = usePersistentState<Client[]>('clients', []);
  const [employees, setEmployees] = usePersistentState<Employee[]>('employees', []);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>('invoices', []);
  const [transactions, setTransactions] = usePersistentState<Transaction[]>('transactions', []);
  
  // Additional States for Reports
  const [trustees, setTrustees] = usePersistentState<Trustee[]>('trustees', []);
  const [trustTransactions, setTrustTransactions] = usePersistentState<TrustTransaction[]>('trustTransactions', []);
  const [investors, setInvestors] = usePersistentState<Investor[]>('investors', []);
  const [activityLogs, setActivityLogs] = usePersistentState<ActivityLog[]>('activityLogs', MOCK_ACTIVITY_LOGS);

  // Auxiliary States
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(new Date().getFullYear());
  const [permissions, setPermissions] = usePersistentState<RolePermissions[]>('permissions', DEFAULT_PERMISSIONS);

  // Navigation Selection State
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);
  
  // Portals
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // -- PERMISSION CHECK --
  const hasPermission = (module: SystemModule): boolean => {
    if (!currentUser) return false;
    const userPerms = permissions.find(p => p.role === currentUser.role);
    return userPerms ? userPerms.canView.includes(module) : false;
  };

  // --- SMART UPDATE HANDLERS ---
  const handleUpdateTransactions = (newTransactions: Transaction[]) => {
      setTransactions(newTransactions);
      // Recalculate project financials
      const updatedProjects = projects.map(project => {
          const projectTxns = newTransactions.filter(t => t.projectId === project.id);
          const revenue = projectTxns.filter(t => t.type === TransactionType.RECEIPT).reduce((sum, t) => sum + t.amount, 0);
          const expenses = projectTxns.filter(t => t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
          return { ...project, revenue, expenses };
      });
      setProjects(updatedProjects);
      if (selectedProjectForDetails) {
          const updatedSelected = updatedProjects.find(p => p.id === selectedProjectForDetails.id);
          if (updatedSelected) setSelectedProjectForDetails(updatedSelected);
      }
  };

  // CENTRALIZED LOGGING FUNCTION
  const handleLogActivity = (action: ActivityLog['action'], entity: ActivityLog['entity'], description: string, entityId?: string) => {
      if (!currentUser) return;
      const newLog: ActivityLog = {
          id: `log-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action,
          entity,
          entityId,
          description,
          timestamp: new Date().toISOString()
      };
      setActivityLogs([newLog, ...activityLogs]);
  };

  const handleLogin = (emailOrUsername: string, password?: string) => {
    const identifier = emailOrUsername.trim().toLowerCase();
    const pwd = password?.trim();

    const staffUser = systemUsers.find(u => u.email.toLowerCase() === identifier);
    if (staffUser && staffUser.password === pwd) {
      setIsAuthenticated(true);
      setCurrentUser(staffUser);
      setCurrentPage('dashboard');
      handleLogActivity('LOGIN', 'Settings', 'تسجيل دخول للنظام');
      return;
    }
    
    const client = clients.find(c => c.username.toLowerCase() === identifier && c.password === pwd);
    if (client) {
      setIsAuthenticated(true);
      setCurrentUser({ id: client.id, name: client.name, role: UserRole.CLIENT, email: client.email, avatar: client.avatar || '', clientUsername: client.username });
      return;
    }

    const employee = employees.find(e => (e.username?.toLowerCase() === identifier || e.email?.toLowerCase() === identifier) && e.password === pwd);
    if (employee) {
      setIsAuthenticated(true);
      setCurrentUser({ id: employee.id, name: employee.name, role: UserRole.EMPLOYEE, email: employee.email, avatar: employee.avatar, employeeId: employee.id });
      setCurrentEmployee(employee);
      return;
    }

    alert("بيانات الدخول غير صحيحة");
  };

  const handleLogout = () => {
    handleLogActivity('LOGIN', 'Settings', 'تسجيل خروج من النظام');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentEmployee(null);
  };

  const handleViewClientProjects = (client: Client) => {
    setSelectedClientForDetails(client);
    setCurrentPage('client-details');
  };

  const handleViewProjectDetails = (project: Project) => {
    const latestProject = projects.find(p => p.id === project.id) || project;
    setSelectedProjectForDetails(latestProject);
    setCurrentPage('project-details');
  };

  const handleDeleteProject = (projectId: string) => {
      const projectToDelete = projects.find(p => p.id === projectId);
      if (!projectToDelete) return;
      if (window.confirm(`هل أنت متأكد من حذف المشروع "${projectToDelete.name}" نهائياً؟`)) {
          const updatedProjects = projects.filter(p => p.id !== projectId);
          setProjects(updatedProjects);
          if (selectedProjectForDetails && selectedProjectForDetails.id === projectId) {
              setSelectedProjectForDetails(null);
              setCurrentPage('projects');
          }
          handleLogActivity('DELETE', 'Project', `حذف المشروع: ${projectToDelete.name}`, projectId);
      }
  };

  const handleGlobalSearchSelect = (item: SearchResultItem) => {
    if (item.type === 'project') handleViewProjectDetails(item.data);
    else if (item.type === 'client') handleViewClientProjects(item.data);
    else if (item.type === 'employee') setCurrentPage('hr');
    else if (item.type === 'invoice') setCurrentPage('invoices');
  };

  useEffect(() => {
      if (!isAuthenticated || !currentUser) return;
      if (['dashboard', 'notifications', 'client-details', 'project-details'].includes(currentPage)) return; 
      
      const moduleMap: Record<string, SystemModule> = {
          'transactions_syp': 'transactions',
          'messages': 'dashboard',
          'manager_reports': 'hr',
      };
      const moduleToCheck = moduleMap[currentPage] || currentPage as SystemModule;
      if ([UserRole.CLIENT, UserRole.EMPLOYEE, UserRole.TRUSTEE, UserRole.INVESTOR].includes(currentUser.role)) return;
      if (!hasPermission(moduleToCheck)) {
          setCurrentPage('dashboard');
      }
  }, [currentPage, currentUser, permissions]);

  if (!isAuthenticated || !currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentUser.role === UserRole.CLIENT && currentUser.clientUsername) {
    return <ClientPortal clientUsername={currentUser.clientUsername} onLogout={handleLogout} />;
  }
  if (currentUser.role === UserRole.EMPLOYEE && currentEmployee) {
    return <EmployeePortal employee={currentEmployee} onLogout={handleLogout} />;
  }

  const renderContent = () => {
    const check = (module: SystemModule, component: React.ReactNode) => {
        return hasPermission(module) ? component : <div className="text-center p-10">غير مصرح لك بالوصول</div>;
    };

    switch (currentPage) {
      case 'dashboard': 
        return <Dashboard 
                  onNavigate={setCurrentPage} 
                  selectedYear={selectedFiscalYear}
                  projects={projects}
                  transactions={transactions}
                  invoices={invoices}
               />;
      case 'projects': 
        return check('projects', (
          <Projects 
            projects={projects} 
            onUpdateProjects={setProjects} 
            onDeleteProject={handleDeleteProject} 
            onViewDetails={handleViewProjectDetails} 
            currentUser={currentUser}
            clients={clients} 
            onAction={handleLogActivity} // PASS LOGGER
          />
        ));
      case 'project-details': 
        if (!selectedProjectForDetails) return <Projects projects={projects} onUpdateProjects={setProjects} onDeleteProject={handleDeleteProject} onViewDetails={handleViewProjectDetails} currentUser={currentUser} clients={clients} onAction={handleLogActivity} />;
        return (
          <ProjectDetails 
            project={selectedProjectForDetails}
            projects={projects} 
            onUpdateProject={(updated) => {
                setProjects(projects.map(p => p.id === updated.id ? updated : p));
                setSelectedProjectForDetails(updated);
            }}
            onDeleteProject={handleDeleteProject} 
            onViewProject={handleViewProjectDetails} 
            onBack={() => setCurrentPage('projects')} 
            employees={employees} 
            transactions={transactions} 
          />
        );
      case 'clients': 
        return check('clients', (
            <Clients 
                clients={clients} 
                onUpdateClients={setClients}
                onViewProjects={handleViewClientProjects} 
                currentUser={currentUser} 
                onAction={handleLogActivity} // PASS LOGGER
            />
        ));
      case 'client-details':
        if (!selectedClientForDetails) return <Clients clients={clients} onUpdateClients={setClients} onViewProjects={handleViewClientProjects} currentUser={currentUser} onAction={handleLogActivity} />;
        return (
          <ClientDetails 
            client={selectedClientForDetails} 
            projects={projects} 
            transactions={transactions} 
            onBack={() => setCurrentPage('clients')} 
            onViewProjectDetails={handleViewProjectDetails} 
          />
        );
      case 'transactions': 
        return check('transactions', (
            <Transactions 
                transactions={transactions}
                onUpdateTransactions={handleUpdateTransactions} 
                projects={projects}
                employees={employees}
                clients={clients}
                investors={investors} // Passed
                trustees={trustees}   // Passed
                selectedYear={selectedFiscalYear} 
                currentUser={currentUser} 
                invoices={invoices}
                onUpdateInvoices={setInvoices}
                onAction={handleLogActivity} // PASS LOGGER
            />
        ));
      case 'company_expenses': return check('company_expenses', (
          <CompanyExpenses 
            selectedYear={selectedFiscalYear} 
            transactions={transactions} 
            onUpdateTransactions={handleUpdateTransactions} 
          />
      )); 
      case 'profit_loss': return check('profit_loss', (
          <ProfitLoss 
            selectedYear={selectedFiscalYear} 
            transactions={transactions} 
            projects={projects} 
          />
      )); 
      case 'trusts': return check('trusts', <Trusts />); 
      case 'investors': return check('investors', <Investors />);
      case 'transactions_syp': return check('transactions', <TransactionsSYP />);
      case 'invoices': 
        return check('invoices', (
            <Invoices 
                invoices={invoices}
                onUpdateInvoices={setInvoices}
                projects={projects}
                currentUser={currentUser} 
                onAction={handleLogActivity} // PASS LOGGER
            />
        ));
      case 'messages': return <Messages />; 
      case 'settings': return check('settings', (
          <Settings 
            permissions={permissions} 
            onUpdatePermissions={setPermissions} 
            currentUser={currentUser} 
            systemUsers={systemUsers}
            onUpdateSystemUsers={setSystemUsers}
            onAction={handleLogActivity} // PASS LOGGER
          />
      ));
      case 'reports': return check('reports', (
          <Reports 
            selectedYear={selectedFiscalYear} 
            projects={projects}
            transactions={transactions}
            employees={employees}
            trustees={trustees}
            trustTransactions={trustTransactions}
          />
      ));
      case 'hr': return check('hr', <HR employees={employees} onUpdateEmployees={setEmployees} />);
      case 'manager_reports': return check('hr', <ManagerReports employees={employees} />);
      case 'files': return check('files', <Files />);
      case 'activity_log': return check('activity_log', <ActivityLogs logs={activityLogs} />);
      case 'notifications': return <Notifications />;
      default: return <Dashboard onNavigate={setCurrentPage} selectedYear={selectedFiscalYear} projects={projects} transactions={transactions} invoices={invoices} />;
    }
  };

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      currentPage={currentPage === 'client-details' ? 'clients' : currentPage === 'project-details' ? 'projects' : currentPage}
      onNavigate={setCurrentPage}
      onSearchSelect={handleGlobalSearchSelect}
      selectedYear={selectedFiscalYear}
      onYearChange={setSelectedFiscalYear}
      permissions={permissions} 
      searchData={{ projects, clients, employees, invoices }}
    >
      {renderContent()}
      
      {/* INTEGRATED AI ASSISTANT */}
      <AIAssistant 
        projects={projects}
        transactions={transactions}
        invoices={invoices}
        currentUser={currentUser}
      />
    </Layout>
  );
};

export default App;
