
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  label,
  className = '',
  required = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-colors bg-white dark:bg-dark-950 dark:text-white ${disabled ? 'bg-gray-100 dark:bg-dark-800 cursor-not-allowed opacity-60' : 'hover:border-primary-500'} ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : 'border-gray-300 dark:border-dark-700'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate ${selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 dark:border-dark-700 relative">
            <Search size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-2 pr-8 py-1.5 text-sm bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:border-primary-500 dark:text-white"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 ${option.value === value ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
