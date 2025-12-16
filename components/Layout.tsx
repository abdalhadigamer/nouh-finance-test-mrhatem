
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
  Activity // Added Activity Icon
} from 'lucide-react';
import { User, UserRole, RolePermissions } from '../types';
import { MOCK_NOTIFICATIONS, MOCK_PROJECTS, MOCK_CLIENTS, MOCK_EMPLOYEES, MOCK_INVOICES } from '../constants';
import { formatCurrency } from '../services/dataService';

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
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate, onSearchSelect, selectedYear, onYearChange, permissions }) => {
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Desktop sidebar state
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Notification dropdown state
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Generate Year Options (e.g., Current Year - 2 to Current Year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i); // 2021 to 2025

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResultItem[] = [];

    // Projects
    MOCK_PROJECTS.forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.clientName.toLowerCase().includes(query) || p.location.toLowerCase().includes(query)) {
        results.push({ id: p.id, type: 'project', title: p.name, subtitle: `مشروع - ${p.clientName}`, data: p });
      }
    });

    // Clients
    MOCK_CLIENTS.forEach(c => {
      if (c.name.toLowerCase().includes(query) || c.companyName?.toLowerCase().includes(query)) {
        results.push({ id: c.id, type: 'client', title: c.name, subtitle: c.companyName || 'عميل', data: c });
      }
    });

    // Employees
    MOCK_EMPLOYEES.forEach(e => {
      if (e.name.toLowerCase().includes(query) || e.role.toLowerCase().includes(query)) {
        results.push({ id: e.id, type: 'employee', title: e.name, subtitle: e.role, data: e });
      }
    });
    
    // Invoices
    MOCK_INVOICES.forEach(inv => {
       if (inv.invoiceNumber.toLowerCase().includes(query) || inv.supplierName.toLowerCase().includes(query) || inv.supplierOrClient?.toLowerCase().includes(query)) {
           results.push({ id: inv.id, type: 'invoice', title: inv.invoiceNumber, subtitle: `${inv.type} - ${formatCurrency(inv.amount)}`, data: inv });
       }
    });

    setSearchResults(results.slice(0, 8)); // Limit results
  }, [searchQuery]);

  const handleSearchSelect = (item: SearchResultItem) => {
      if (onSearchSelect) {
          onSearchSelect(item);
      }
      setSearchQuery('');
      setIsSearchOpen(false);
  };

  const getResultIcon = (type: string) => {
      switch(type) {
          case 'project': return <Briefcase size={16} className="text-primary-600" />;
          case 'client': return <UserCircle size={16} className="text-green-600" />;
          case 'employee': return <Users size={16} className="text-blue-600" />;
          case 'invoice': return <FileText size={16} className="text-orange-600" />;
          default: return <Search size={16} />;
      }
  };

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'projects', label: 'إدارة المشاريع', icon: Briefcase },
    { id: 'clients', label: 'العملاء', icon: UserCircle }, 
    { id: 'company_expenses', label: 'مصاريف الشركة', icon: Building2 },
    { id: 'profit_loss', label: 'الأرباح والخسائر', icon: BarChart4 }, 
    { id: 'investors', label: 'المستثمرين والشركاء', icon: TrendingUp },
    { id: 'trusts', label: 'الأمانات والودائع', icon: Shield },
    { id: 'messages', label: 'الرسائل والمحادثات', icon: MessageSquare },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: 'transactions', label: 'الحركات المالية $', icon: ArrowRightLeft },
    { id: 'transactions_syp', label: 'الحركات المالية ل.س', icon: Coins },
    { id: 'reports', label: 'التقارير المالية', icon: PieChart },
    { id: 'hr', label: 'الموارد البشرية', icon: Users },
    { id: 'manager_reports', label: 'التقارير والدوام', icon: ClipboardList },
    { id: 'files', label: 'الأرشيف الإلكتروني', icon: Files },
    { id: 'activity_log', label: 'سجل العمليات', icon: Activity }, // NEW ITEM
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
      // Always allow messages if not specified (optional) or restrict it?
      // Assuming 'messages' wasn't in the enum, so show it for everyone or map it.
      // Mapping special cases or defaults:
      if (item.id === 'messages' || item.id === 'transactions_syp') return true; 
      
      // Special: manager_reports is usually HR
      if (item.id === 'manager_reports') return userPermissions?.canView.includes('hr');

      // Default check against permission list
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
                      {/* Fake notification dot for messages */}
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

            {/* Search */}
            <div className="relative hidden md:block group" ref={searchRef}>
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 w-4 h-4 transition-colors" />
              <input 
                type="text" 
                placeholder="بحث سريع (مشروع، عميل، موظف)..." 
                className="pl-4 pr-10 py-2.5 border border-gray-200 dark:border-dark-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-72 bg-gray-50 dark:bg-dark-900 dark:text-white focus:bg-white dark:focus:bg-dark-950 transition-all shadow-sm focus:shadow-md"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
              
              {/* Search Results Dropdown */}
              {isSearchOpen && searchQuery.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-dark-900 rounded-xl shadow-xl border border-gray-100 dark:border-dark-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      {searchResults.length > 0 ? (
                          <ul className="py-2 max-h-80 overflow-y-auto custom-scrollbar">
                              {searchResults.map((result) => (
                                  <li key={`${result.type}-${result.id}`}>
                                      <button 
                                          className="w-full text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-800 flex items-center gap-3 transition-colors group"
                                          onClick={() => handleSearchSelect(result)}
                                      >
                                          <div className="p-2 bg-gray-100 dark:bg-dark-800 rounded-lg group-hover:bg-white dark:group-hover:bg-dark-700 transition-colors">
                                              {getResultIcon(result.type)}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors">{result.title}</p>
                                              <p className="text-xs text-gray-500 dark:text-gray-400">{result.subtitle}</p>
                                          </div>
                                      </button>
                                  </li>
                              ))}
                          </ul>
                      ) : (
                          <div className="p-6 text-center text-gray-400 text-sm">
                              لا توجد نتائج مطابقة
                          </div>
                      )}
                  </div>
              )}
            </div>

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
    </div>
  );
};

export default Layout;
