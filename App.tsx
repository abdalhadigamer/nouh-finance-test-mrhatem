
import React, { useState } from 'react';
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
import Messages from './components/Messages'; // NEW IMPORT
import { MOCK_USERS, MOCK_PROJECTS, MOCK_CLIENTS, MOCK_EMPLOYEES, LOGO_URL } from './constants';
import { User, UserRole, Client, Employee, Project } from './types';

// Simple Auth Login Component
const LoginScreen = ({ onLogin }: { onLogin: (emailOrUsername: string, password?: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
          {/* Logo added here */}
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
             <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-primary-900 font-cairo mb-2">وكالة نوح</h1>
          <p className="text-gray-500 text-sm">للعمارة والتصميم</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400" 
              placeholder="name@noah.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="rememberMe"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer accent-primary-600"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer font-medium select-none">
              تذكرني
            </label>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/30 transform hover:scale-[1.02]">
            تسجيل الدخول
          </button>
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
  
  // --- GLOBAL STATE ---
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);

  // Navigation State
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const handleLogin = (emailOrUsername: string, password?: string) => {
    const identifier = emailOrUsername.trim().toLowerCase();
    const pwd = password?.trim();

    const staffUser = MOCK_USERS.find(u => u.email.toLowerCase() === identifier);
    
    if (staffUser) {
      setIsAuthenticated(true);
      setCurrentUser(staffUser);
      setCurrentPage('dashboard');
      return;
    }

    const client = MOCK_CLIENTS.find(c => 
      c.username.toLowerCase() === identifier && 
      c.password === pwd
    );

    if (client) {
      setIsAuthenticated(true);
      setCurrentUser({
        id: client.id,
        name: client.name,
        role: UserRole.CLIENT,
        email: client.email, 
        avatar: client.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${client.name}`,
        clientUsername: client.username 
      });
      return;
    }

    const employee = employees.find(e => {
       const isUsernameMatch = e.username?.toLowerCase() === identifier;
       const isEmailMatch = e.email?.toLowerCase() === identifier;
       const isNameMatch = e.name.toLowerCase() === identifier;
       const isPasswordMatch = e.password === pwd;
       return (isUsernameMatch || isEmailMatch || isNameMatch) && isPasswordMatch;
    });

    if (employee) {
      setIsAuthenticated(true);
      setCurrentUser({
        id: employee.id,
        name: employee.name,
        role: UserRole.EMPLOYEE,
        email: employee.email,
        avatar: employee.avatar,
        employeeId: employee.id
      });
      setCurrentEmployee(employee);
      return;
    }

    // Legacy Client Logic
    const matchedProjects = projects.filter(p => 
      p.clientUsername && 
      p.clientUsername.toLowerCase() === identifier && 
      p.clientPassword === pwd
    );

    if (matchedProjects.length > 0) {
      const firstProject = matchedProjects[0];
      setIsAuthenticated(true);
      setCurrentUser({
        id: `client-${firstProject.clientUsername}`,
        name: firstProject.clientName,
        role: UserRole.CLIENT,
        email: emailOrUsername,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstProject.clientName}`,
        clientUsername: firstProject.clientUsername
      });
      return;
    }

    alert("بيانات الدخول غير صحيحة");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentEmployee(null);
  };

  const handleViewClientProjects = (client: Client) => {
    setSelectedClientForDetails(client);
    setCurrentPage('client-details');
  };

  const handleViewProjectDetails = (project: Project) => {
    // IMPORTANT: Always find the latest version from the global state
    const latestProject = projects.find(p => p.id === project.id) || project;
    setSelectedProjectForDetails(latestProject);
    setCurrentPage('project-details');
  };

  // Helper to update a single project in the global list
  const handleUpdateProject = (updatedProject: Project) => {
      const updatedList = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      setProjects(updatedList);
      setSelectedProjectForDetails(updatedProject); // Ensure detail view sees update
  };

  // Global Search Handler
  const handleGlobalSearchSelect = (item: SearchResultItem) => {
    if (item.type === 'project') {
       handleViewProjectDetails(item.data);
    } else if (item.type === 'client') {
       handleViewClientProjects(item.data);
    } else if (item.type === 'employee') {
       setCurrentPage('hr');
    } else if (item.type === 'invoice') {
       setCurrentPage('invoices');
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentUser.role === UserRole.CLIENT && currentUser.clientUsername) {
    return (
      <ClientPortal 
        clientUsername={currentUser.clientUsername} 
        onLogout={handleLogout}
      />
    );
  }

  if (currentUser.role === UserRole.EMPLOYEE && currentEmployee) {
    return (
      <EmployeePortal 
        employee={currentEmployee} 
        onLogout={handleLogout} 
      />
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'projects': 
        return (
          <Projects 
            projects={projects} 
            onUpdateProjects={setProjects} 
            onViewDetails={handleViewProjectDetails} 
          />
        );
      case 'project-details': 
        if (!selectedProjectForDetails) return <Projects projects={projects} onUpdateProjects={setProjects} onViewDetails={handleViewProjectDetails} />;
        return (
          <ProjectDetails 
            project={selectedProjectForDetails} 
            onUpdateProject={handleUpdateProject} 
            onBack={() => setCurrentPage('projects')} 
          />
        );
      case 'clients': return <Clients onViewProjects={handleViewClientProjects} />;
      case 'client-details':
        if (!selectedClientForDetails) return <Clients onViewProjects={handleViewClientProjects} />;
        return (
          <ClientDetails 
            client={selectedClientForDetails} 
            projects={projects} // Pass live projects data
            onBack={() => setCurrentPage('clients')} 
            onViewProjectDetails={handleViewProjectDetails} 
          />
        );
      case 'transactions': return <Transactions />;
      case 'transactions_syp': return <TransactionsSYP />;
      case 'invoices': return <Invoices />;
      case 'messages': return <Messages />; // NEW PAGE
      case 'settings': return <Settings />;
      case 'reports': return <Reports />;
      case 'hr': return <HR employees={employees} onUpdateEmployees={setEmployees} />;
      case 'manager_reports': return <ManagerReports employees={employees} />;
      case 'files': return <Files />;
      case 'notifications': return <Notifications />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      currentPage={currentPage === 'client-details' ? 'clients' : currentPage === 'project-details' ? 'projects' : currentPage}
      onNavigate={setCurrentPage}
      onSearchSelect={handleGlobalSearchSelect}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
