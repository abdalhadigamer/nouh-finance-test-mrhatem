
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-dark-800 transition-colors duration-300"
        dir="rtl"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-dark-800">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
