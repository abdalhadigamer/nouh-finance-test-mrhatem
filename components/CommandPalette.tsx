
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Briefcase, Users, FileText, LayoutDashboard, Settings, User } from 'lucide-react';
import { Project, Client, Employee, Invoice } from '../types';
import { formatCurrency } from '../services/dataService';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onSearchSelect: (item: any) => void;
  searchData: {
    projects: Project[];
    clients: Client[];
    employees: Employee[];
    invoices: Invoice[];
  };
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onSearchSelect, searchData }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query]); // Added query to dependency to refresh results list length

  // Generate Results
  const getResults = () => {
    const q = query.toLowerCase().trim();
    if (!q) return [
      { id: 'nav-dash', type: 'nav', title: 'لوحة التحكم', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
      { id: 'nav-projects', type: 'nav', title: 'المشاريع', icon: Briefcase, action: () => onNavigate('projects') },
      { id: 'nav-invoices', type: 'nav', title: 'الفواتير', icon: FileText, action: () => onNavigate('invoices') },
      { id: 'nav-clients', type: 'nav', title: 'العملاء', icon: Users, action: () => onNavigate('clients') },
      { id: 'nav-settings', type: 'nav', title: 'الإعدادات', icon: Settings, action: () => onNavigate('settings') },
    ];

    const results = [];

    // Pages
    if ('لوحة التحكم'.includes(q) || 'dashboard'.includes(q)) results.push({ id: 'nav-dash', type: 'nav', title: 'لوحة التحكم', icon: LayoutDashboard, action: () => onNavigate('dashboard') });
    if ('المشاريع'.includes(q) || 'projects'.includes(q)) results.push({ id: 'nav-projects', type: 'nav', title: 'المشاريع', icon: Briefcase, action: () => onNavigate('projects') });
    if ('العملاء'.includes(q) || 'clients'.includes(q)) results.push({ id: 'nav-clients', type: 'nav', title: 'العملاء', icon: Users, action: () => onNavigate('clients') });

    // Projects
    searchData.projects.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)) {
        results.push({ id: p.id, type: 'project', title: p.name, subtitle: `مشروع - ${p.clientName}`, icon: Briefcase, data: p });
      }
    });

    // Clients
    searchData.clients.forEach(c => {
      if (c.name.toLowerCase().includes(q)) {
        results.push({ id: c.id, type: 'client', title: c.name, subtitle: 'عميل', icon: User, data: c });
      }
    });

    // Invoices
    searchData.invoices.forEach(inv => {
      if (inv.invoiceNumber.toLowerCase().includes(q) || inv.supplierName.toLowerCase().includes(q)) {
        results.push({ id: inv.id, type: 'invoice', title: inv.invoiceNumber, subtitle: `${formatCurrency(inv.amount)} - ${inv.supplierName}`, icon: FileText, data: inv });
      }
    });

    return results.slice(0, 10);
  };

  const results = getResults();

  const handleSelect = (item: any) => {
    if (item.type === 'nav') {
      item.action();
    } else {
      onSearchSelect({ type: item.type, data: item.data });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="w-full max-w-2xl bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-700 flex flex-col max-h-[60vh]">
        <div className="flex items-center border-b border-gray-100 dark:border-dark-800 p-4">
          <Search className="w-5 h-5 text-gray-400 ml-3" />
          <input 
            ref={inputRef}
            type="text" 
            className="flex-1 bg-transparent text-lg text-gray-800 dark:text-white placeholder-gray-400 outline-none h-8"
            placeholder="اكتب للبحث أو التنقل..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 border border-gray-200 dark:border-dark-700 px-2 py-1 rounded">
            <span>ESC</span>
          </div>
        </div>

        <ul ref={listRef} className="overflow-y-auto p-2 custom-scrollbar">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>لا توجد نتائج مطابقة لـ "{query}"</p>
            </div>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-right group ${index === selectedIndex ? 'bg-primary-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'}`}
                  >
                    <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-white/20' : 'bg-gray-100 dark:bg-dark-800 group-hover:bg-white dark:group-hover:bg-dark-700'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${index === selectedIndex ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{item.title}</p>
                      {item.subtitle && <p className={`text-xs ${index === selectedIndex ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>{item.subtitle}</p>}
                    </div>
                    {index === selectedIndex && <ArrowRight size={16} className="text-white animate-pulse" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        
        <div className="bg-gray-50 dark:bg-dark-950 p-2 text-center border-t border-gray-100 dark:border-dark-800">
           <p className="text-[10px] text-gray-400">
             استخدم الأسهم للتنقل <span className="mx-1">↑↓</span> واضغط <span className="font-bold">Enter</span> للاختيار
           </p>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
