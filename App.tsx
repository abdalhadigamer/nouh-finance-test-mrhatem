
import React, { useState, useEffect } from 'react';
import Layout, { SearchResultItem } from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Invoices from './components/Invoices';
import Transactions from './components/Transactions';
import TransactionsSYP from './components/TransactionsSYP';
import CompanyExpenses from './components/CompanyExpenses';
import Reports from './components/Reports';
import HR from './components/HR';
import Files from './components/Files';
import Settings from './components/Settings';
import Login from './components/Login';
import ClientPortal from './components/ClientPortal';
import EmployeePortal from './components/EmployeePortal';
import TrusteePortal from './components/TrusteePortal';
import InvestorPortal from './components/InvestorPortal';
import ProjectDetails from './components/ProjectDetails';
import ClientDetails from './components/ClientDetails';
import ProfitLoss from './components/ProfitLoss';
import Trusts from './components/Trusts';
import Investors from './components/Investors';
import ManagerReports from './components/ManagerReports';
import Messages from './components/Messages';
import ActivityLogs from './components/ActivityLogs';
import AIAssistant from './components/AIAssistant';
import AccountantFocusMode from './components/AccountantFocusMode';
import Notifications from './components/Notifications';

import { 
  MOCK_USERS, DEFAULT_PERMISSIONS, MOCK_PROJECTS, MOCK_CLIENTS, 
  MOCK_INVOICES, MOCK_TRANSACTIONS, MOCK_EMPLOYEES, MOCK_PAYROLL, 
  MOCK_ATTENDANCE, MOCK_DAILY_REPORTS, MOCK_TRUSTEES, MOCK_TRUST_TRANSACTIONS,
  MOCK_INVESTORS, MOCK_INVESTOR_TRANSACTIONS, MOCK_SYP_TRANSACTIONS, MOCK_ACTIVITY_LOGS 
} from './constants';
import { User, Project, Client, Invoice, Transaction, Employee, PayrollRecord, AttendanceRecord, DailyReport, RolePermissions, Trustee, TrustTransaction, Investor, InvestorTransaction, ActivityLog } from './types';
import { logActivity } from './services/auditService';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // App Data State (Lifted Up)
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [sypTransactions, setSypTransactions] = useState<Transaction[]>(MOCK_SYP_TRANSACTIONS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(MOCK_PAYROLL);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(MOCK_DAILY_REPORTS);
  const [trustees, setTrustees] = useState<Trustee[]>(MOCK_TRUSTEES);
  const [trustTransactions, setTrustTransactions] = useState<TrustTransaction[]>(MOCK_TRUST_TRANSACTIONS);
  const [investors, setInvestors] = useState<Investor[]>(MOCK_INVESTORS);
  const [investorTransactions, setInvestorTransactions] = useState<InvestorTransaction[]>(MOCK_INVESTOR_TRANSACTIONS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(MOCK_ACTIVITY_LOGS);
  const [systemUsers, setSystemUsers] = useState<User[]>(MOCK_USERS);
  const [permissions, setPermissions] = useState<RolePermissions[]>(DEFAULT_PERMISSIONS);

  // Navigation State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    // Audit Log
    logActivity(user, 'LOGIN', 'Settings', 'تسجيل دخول للنظام');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setSelectedProject(null);
    setSelectedClient(null);
  };

  const handleAuditAction = (action: ActivityLog['action'], entity: ActivityLog['entity'], desc: string, id?: string) => {
      if (currentUser) {
          logActivity(currentUser, action, entity, desc, id);
          // Sync local state for immediate update in UI
          setActivityLogs(prev => [
              {
                  id: `log-${Date.now()}`,
                  userId: currentUser.id,
                  userName: currentUser.name,
                  userRole: currentUser.role,
                  action,
                  entity,
                  entityId: id,
                  description: desc,
                  timestamp: new Date().toISOString()
              },
              ...prev
          ]);
      }
  };

  const handleSearchSelect = (item: SearchResultItem) => {
      if (item.type === 'project') {
          const proj = projects.find(p => p.id === item.id);
          if (proj) {
              setSelectedProject(proj);
              setCurrentPage('project-details');
          }
      } else if (item.type === 'client') {
          const client = clients.find(c => c.id === item.id);
          if (client) {
              setSelectedClient(client);
              setCurrentPage('client-details');
          }
      } else if (item.type === 'invoice') {
          setCurrentPage('invoices');
          // Ideally scroll to invoice
      }
  };

  // Special Handler used by Accountant Focus Mode to split mixed currency transactions
  const handleBulkTransactionSave = (newTxns: Transaction[]) => {
      const usdTxns = newTxns.filter(t => t.currency !== 'SYP');
      const sypTxns = newTxns.filter(t => t.currency === 'SYP');

      if (usdTxns.length > 0) {
          setTransactions(prev => [...usdTxns, ...prev]);
      }
      if (sypTxns.length > 0) {
          setSypTransactions(prev => [...sypTxns, ...prev]);
      }
      
      handleAuditAction('CREATE', 'Transaction', `إدخال سريع لعدد ${newTxns.length} عملية (دولار وليرة سورية)`);
  };

  // --- RENDER ---

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} clients={clients} employees={employees} trustees={trustees} investors={investors} systemUsers={systemUsers} />;
  }

  // Specialized Portals based on User Role (if not Admin/Staff)
  if (currentUser?.role === 'Client') {
      return (
        <ClientPortal 
            clientUsername={currentUser.clientUsername || ''} 
            onLogout={handleLogout} 
            projects={projects} // Pass live projects
            invoices={invoices} // Pass live invoices
        />
      );
  }
  if (currentUser?.role === 'Employee' && currentUser.employeeId) {
      const emp = employees.find(e => e.id === currentUser.employeeId);
      if (emp) return <EmployeePortal employee={emp} onLogout={handleLogout} payroll={payroll} attendance={attendance} dailyReports={dailyReports} />;
  }
  if (currentUser?.role === 'Trustee' && currentUser.trusteeId) {
      const trustee = trustees.find(t => t.id === currentUser.trusteeId);
      if (trustee) return (
        <TrusteePortal 
            trustee={trustee} 
            onLogout={handleLogout} 
            trustTransactions={trustTransactions} // Pass live transactions
        />
      );
  }
  if (currentUser?.role === 'Investor' && currentUser.investorId) {
      const inv = investors.find(i => i.id === currentUser.investorId);
      if (inv) return (
        <InvestorPortal 
            investor={inv} 
            onLogout={handleLogout} 
            investorTransactions={investorTransactions} // Pass live transactions
        />
      );
  }

  // --- MAIN ADMIN LAYOUT RENDER ---

  // Check Permissions Helper
  const check = (module: any, component: React.ReactNode) => {
      const userPerms = permissions.find(p => p.role === currentUser?.role);
      if (!userPerms || !userPerms.canView.includes(module)) {
          return <div className="p-10 text-center text-gray-500">عذراً، ليس لديك صلاحية للوصول لهذا القسم.</div>;
      }
      return component;
  };

  const renderContent = () => {
    if (currentPage === 'project-details' && selectedProject) {
        return (
            <ProjectDetails 
                project={selectedProject} 
                onUpdateProject={(p) => setProjects(projects.map(proj => proj.id === p.id ? p : proj))}
                onBack={() => { setSelectedProject(null); setCurrentPage('projects'); }}
                transactions={transactions}
                invoices={invoices}
                projects={projects} // For relations
                onDeleteProject={(id) => {
                    setProjects(projects.filter(p => p.id !== id));
                    setCurrentPage('projects');
                }}
            />
        );
    }

    if (currentPage === 'client-details' && selectedClient) {
        return (
            <ClientDetails 
                client={selectedClient}
                projects={projects}
                transactions={transactions}
                onBack={() => { setSelectedClient(null); setCurrentPage('clients'); }}
                onViewProjectDetails={(p) => { setSelectedProject(p); setCurrentPage('project-details'); }}
            />
        );
    }

    if (currentPage === 'accountant_focus') {
        return (
            <AccountantFocusMode 
                onBack={() => setCurrentPage('dashboard')}
                onSaveBulk={handleBulkTransactionSave}
                projects={projects}
                currentUser={currentUser || undefined}
            />
        );
    }

    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} selectedYear={selectedYear} projects={projects} transactions={transactions} invoices={invoices} />;
      case 'projects': return check('projects', (
          <Projects 
            projects={projects} 
            onUpdateProjects={setProjects} 
            onViewDetails={(p) => { setSelectedProject(p); setCurrentPage('project-details'); }}
            currentUser={currentUser || undefined}
            clients={clients}
            onAction={handleAuditAction}
          />
      ));
      case 'clients': return check('clients', (
          <Clients 
            clients={clients} 
            onUpdateClients={setClients} 
            onViewProjects={(c) => { setSelectedClient(c); setCurrentPage('client-details'); }}
            currentUser={currentUser || undefined}
            onAction={handleAuditAction}
          />
      ));
      case 'company_expenses': return check('company_expenses', (
          <CompanyExpenses 
            selectedYear={selectedYear} 
            transactions={transactions} 
            onUpdateTransactions={setTransactions}
          />
      ));
      case 'profit_loss': return check('profit_loss', (
          <ProfitLoss 
            selectedYear={selectedYear} 
            transactions={transactions} 
            projects={projects}
          />
      ));
      case 'investors': return check('investors', (
          <Investors 
            investors={investors}
            onUpdateInvestors={setInvestors}
            investorTransactions={investorTransactions}
            onUpdateInvestorTransactions={setInvestorTransactions}
            projects={projects}
          />
      ));
      case 'trusts': return check('trusts', (
          <Trusts 
            trustees={trustees}
            onUpdateTrustees={setTrustees}
            trustTransactions={trustTransactions}
            onUpdateTrustTransactions={setTrustTransactions}
          />
      ));
      case 'transactions_syp': return check('transactions', (
          <TransactionsSYP 
            transactions={sypTransactions}
            onUpdateTransactions={setSypTransactions}
          />
      ));
      case 'invoices': return check('invoices', (
          <Invoices 
            invoices={invoices} 
            onUpdateInvoices={setInvoices} 
            projects={projects} 
            currentUser={currentUser || undefined}
            onAction={handleAuditAction}
          />
      ));
      case 'transactions': return check('transactions', (
          <Transactions 
            transactions={transactions} 
            onUpdateTransactions={setTransactions} 
            projects={projects} 
            selectedYear={selectedYear}
          />
      ));
      case 'reports': return check('reports', (
          <Reports 
            selectedYear={selectedYear} 
            transactions={transactions} 
            projects={projects}
            employees={employees}
            trustees={trustees}
            trustTransactions={trustTransactions}
          />
      ));
      case 'manager_reports': return check('hr', (
          <ManagerReports 
            employees={employees}
            dailyReports={dailyReports}
            onUpdateDailyReports={setDailyReports}
            attendance={attendance}
          />
      ));
      case 'hr': return check('hr', (
          <HR 
            employees={employees} 
            onUpdateEmployees={setEmployees}
            payroll={payroll}
            onUpdatePayroll={setPayroll}
          />
      ));
      case 'files': return check('files', <Files />);
      case 'messages': return <Messages clients={clients} />;
      case 'activity_log': return check('activity_log', <ActivityLogs logs={activityLogs} />);
      case 'notifications': return <Notifications />;
      case 'settings': return check('settings', (
          <Settings 
            permissions={permissions} 
            onUpdatePermissions={setPermissions} 
            currentUser={currentUser || undefined} 
            systemUsers={systemUsers}
            onUpdateSystemUsers={setSystemUsers}
            onAction={handleAuditAction}
          />
      ));
      default: return <Dashboard onNavigate={setCurrentPage} selectedYear={selectedYear} projects={projects} transactions={transactions} invoices={invoices} />;
    }
  };

  return (
    <Layout 
        user={currentUser!} 
        onLogout={handleLogout} 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        permissions={permissions}
        onSearchSelect={handleSearchSelect}
        searchData={{ projects, clients, employees, invoices }}
    >
      {renderContent()}
      <AIAssistant projects={projects} transactions={transactions} invoices={invoices} currentUser={currentUser} />
    </Layout>
  );
};

export default App;
