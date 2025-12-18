
import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  ArrowRightLeft, 
  Users, 
  Files, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu,
  X,
  Bell,
  Search,
  PieChart,
  ChevronRight,
  ChevronLeft,
  UserCircle,
  ClipboardList,
  Moon,
  Sun,
  PenTool,
  Coins,
  MessageSquare,
  CalendarRange,
  Building2,
  Shield,
  TrendingUp,
  BarChart4,
  Activity,
  Command,
  Zap // Imported Zap Icon
} from 'lucide-react';
import { User, UserRole, RolePermissions, Project, Client, Employee, Invoice } from '../types';
import { MOCK_NOTIFICATIONS } from '../constants';
import { formatCurrency } from '../services/dataService';
import CommandPalette from './CommandPalette';

export interface SearchResultItem {
  id: string;
  type: 'project' | 'client' | 'employee' | 'invoice';
  title: string;
  subtitle?: string;
  data?: any;
}

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  onSearchSelect?: (item: SearchResultItem) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  permissions: RolePermissions[];
  // Data for search
  searchData?: {
      projects: Project[];
      clients: Client[];
      employees: Employee[];
      invoices: Invoice[];
  };
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate, onSearchSelect, selectedYear, onYearChange, permissions, searchData }) => {
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Desktop sidebar state
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Notification dropdown state
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Generate Year Options (e.g., Current Year - 2 to Current Year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i); // 2021 to 2025

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Keyboard Shortcut for Command Palette (Ctrl+K or Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSelect = (item: SearchResultItem) => {
      if (onSearchSelect) {
          onSearchSelect(item);
      }
      setIsCommandPaletteOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'transactions', label: 'الحركات المالية $', icon: ArrowRightLeft },
    { id: 'transactions_syp', label: 'الحركات المالية ل.س', icon: Coins },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: 'company_expenses', label: 'مصاريف الشركة', icon: Building2 },
    { id: 'hr', label: 'الموارد البشرية', icon: Users },
    { id: 'projects', label: 'إدارة المشاريع', icon: Briefcase },
    { id: 'clients', label: 'العملاء', icon: UserCircle }, 
    { id: 'trusts', label: 'الأمانات والودائع', icon: Shield },
    { id: 'investors', label: 'المستثمرين والشركاء', icon: TrendingUp },
    { id: 'reports', label: 'التقارير المالية', icon: PieChart },
    { id: 'manager_reports', label: 'التقارير والدوام', icon: ClipboardList },
    { id: 'profit_loss', label: 'الأرباح والخسائر', icon: BarChart4 }, 
    { id: 'messages', label: 'الرسائل والمحادثات', icon: MessageSquare },
    { id: 'files', label: 'الأرشيف الإلكتروني', icon: Files },
    { id: 'activity_log', label: 'سجل العمليات', icon: Activity },
    { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setIsMobileSidebarOpen(false); 
  };

  const activeNotifications = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  // Filter Menu Items based on permissions
  const userPermissions = permissions.find(p => p.role === user.role);
  const visibleMenuItems = menuItems.filter(item => {
      if (item.id === 'messages' || item.id === 'transactions_syp') return true; 
      if (item.id === 'manager_reports') return userPermissions?.canView.includes('hr');
      return userPermissions ? userPermissions.canView.includes(item.id as any) : true;
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 z-50
        bg-white dark:bg-dark-950 border-l border-gray-100 dark:border-gray-800
        text-gray-800 dark:text-gray-200 transition-all duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
        ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${isDesktopSidebarCollapsed ? 'lg:w-24' : 'lg:w-72'}
        w-72
      `}>
        {/* Brand Area */}
        <div className={`
          h-20 flex items-center border-b border-gray-100 dark:border-gray-800
          ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-between px-6'}
        `}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div className={`transition-all duration-300 ${isDesktopSidebarCollapsed ? 'hidden opacity-0 w-0' : 'block opacity-100'}`}>
              <h1 className="text-xl font-extrabold font-cairo whitespace-nowrap text-primary-900 dark:text-white">وكالة نوح</h1>
              <p className="text-[10px] text-accent-600 dark:text-accent-400 font-bold tracking-wide uppercase">للعمارة والتصميم</p>
            </div>
          </div>
          
          <button 
            className="lg:hidden text-gray-400 hover:text-primary-600"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 overflow-x-hidden custom-scrollbar">
          {/* Focus Mode Button - Special Entry for Accountants/Admins */}
          {[UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.GENERAL_MANAGER].includes(user.role) && (
             <div className="px-4 mb-4">
               <button
                 onClick={() => onNavigate('accountant_focus')}
                 className={`
                   w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:scale-[1.02]
                   ${isDesktopSidebarCollapsed ? 'justify-center' : ''}
                 `}
                 title={isDesktopSidebarCollapsed ? 'وضع التركيز' : ''}
               >
                 <Zap size={22} className="min-w-[22px] animate-pulse-slow" />
                 <span className={`whitespace-nowrap transition-all duration-300 font-bold text-sm ${isDesktopSidebarCollapsed ? 'hidden w-0 opacity-0' : 'block w-auto opacity-100'}`}>
                   وضع التركيز
                 </span>
               </button>
             </div>
          )}

          <ul className="space-y-1 px-4">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                      ${active 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 translate-x-1' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-gray-200'}
                      ${isDesktopSidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={isDesktopSidebarCollapsed ? item.label : ''}
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      <Icon size={22} className={`min-w-[22px] transition-transform duration-300 ${active ? 'text-white scale-110' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:scale-110'}`} />
                      {item.id === 'messages' && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-dark-950 rounded-full animate-pulse"></span>
                      )}
                      
                      <span className={`whitespace-nowrap transition-all duration-300 font-bold text-sm ${isDesktopSidebarCollapsed ? 'hidden w-0 opacity-0' : 'block w-auto opacity-100'}`}>
                        {item.label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-900/50 backdrop-blur-sm">
          <div className={`flex items-center gap-3 mb-4 ${isDesktopSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="relative">
               <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white dark:border-dark-800 shadow-sm" />
               <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-dark-900 rounded-full animate-pulse"></span>
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${isDesktopSidebarCollapsed ? 'hidden w-0 opacity-0' : 'block'}`}>
              <p className="text-sm font-bold truncate text-gray-800 dark:text-gray-200">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className={`
              w-full flex items-center gap-2 bg-white dark:bg-dark-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 py-2.5 rounded-lg transition-colors text-sm font-bold border border-gray-200 dark:border-gray-700
              ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-center'}
            `}
            title="تسجيل خروج"
          >
            <LogOut size={18} />
            <span className={`${isDesktopSidebarCollapsed ? 'hidden' : 'block'}`}>خروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0"></div>

        {/* Header */}
        <header className="bg-white/80 dark:bg-dark-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-20 flex items-center justify-between px-4 lg:px-8 z-30 transition-colors duration-300 sticky top-0">
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <button 
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            {/* Desktop Toggle */}
            <button 
              className="hidden lg:block p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            >
              {isDesktopSidebarCollapsed ? <ChevronLeft size={24} /> : <Menu size={24} />}
            </button>

            <h2 className="text-xl font-bold text-gray-800 dark:text-white hidden md:block animate-in fade-in slide-in-from-left-2">
              {menuItems.find(i => i.id === currentPage)?.label || (currentPage === 'notifications' ? 'مركز الإشعارات' : (currentPage === 'client-details' ? 'تفاصيل العميل' : ''))}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            
            {/* Fiscal Year Selector */}
            <div className="hidden md:flex items-center bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-1 hover:border-primary-200 transition-colors">
                <div className="px-2 text-gray-400 dark:text-gray-500">
                    <CalendarRange size={16} />
                </div>
                <select 
                    value={selectedYear} 
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer py-1 pr-1 pl-2"
                >
                    {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Quick Command Trigger */}
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors border border-transparent hover:border-primary-300"
            >
              <Search size={16} />
              <span>بحث سريع...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs bg-white dark:bg-dark-900 rounded border border-gray-200 dark:border-dark-600 font-mono">⌘K</kbd>
            </button>

            {/* Mobile Search Button */}
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg"
            >
              <Search size={20} />
            </button>

            {/* Dark Mode Toggle */}
            <button
               onClick={toggleDarkMode}
               className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors relative overflow-hidden"
            >
               {isDarkMode ? <Sun size={20} className="animate-in spin-in-90 duration-300" /> : <Moon size={20} className="animate-in spin-in-90 duration-300" />}
            </button>
            
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                className={`relative p-2.5 rounded-full transition-colors ${showNotifications ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} className={activeNotifications > 0 ? 'animate-bounce-short' : ''} />
                {activeNotifications > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-dark-950 animate-ping-slow"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-3 w-80 bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-800/50">
                    <h3 className="font-bold text-gray-800 dark:text-white">الإشعارات</h3>
                    <span className="text-xs text-primary-600 cursor-pointer hover:underline">مسح الكل</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {MOCK_NOTIFICATIONS.slice(0, 4).map((notif, i) => (
                      <div key={i} className={`p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.type === 'error' ? 'bg-red-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate('notifications');
                      }}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700"
                    >
                      عرض كل الإشعارات
                    </button>
                  </div>
                </div>
              )}
            </div>

            {visibleMenuItems.some(i => i.id === 'settings') && (
              <button 
                className={`p-2.5 rounded-full transition-colors ${currentPage === 'settings' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}
                onClick={() => onNavigate('settings')}
              >
                <SettingsIcon size={20} className="hover:rotate-45 transition-transform duration-300" />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar z-10">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
        onSearchSelect={handleSearchSelect}
        searchData={searchData || { projects: [], clients: [], employees: [], invoices: [] }}
      />
    </div>
  );
};

export default Layout;
