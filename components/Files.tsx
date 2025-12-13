
import React, { useState } from 'react';
import { ArchiveFile } from '../types';
import { MOCK_FILES } from '../constants';
import { Folder, FileText, Image as ImageIcon, FileSpreadsheet, Download, Upload, Search, ChevronRight, MoreVertical } from 'lucide-react';

const Files: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [files, setFiles] = useState<ArchiveFile[]>(MOCK_FILES);
  const [isDragging, setIsDragging] = useState(false);

  // Filter files based on current directory (simple single-level logic for demo)
  // In a real app, you'd filter by parentId matching the current folder's ID
  const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : undefined;
  
  const displayedFiles = files.filter(f => {
      if (!currentFolderId) return !f.parentId; // Root files
      return f.parentId === currentFolderId;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Simulate File Upload
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       const newFiles: ArchiveFile[] = Array.from(e.dataTransfer.files).map((file: File, idx) => ({
           id: `new-${Date.now()}-${idx}`,
           name: file.name,
           type: file.type.includes('image') ? 'image' : 'pdf', // Simple detection
           size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
           date: new Date().toISOString().split('T')[0],
           parentId: currentFolderId
       }));
       setFiles([...files, ...newFiles]);
       alert(`${newFiles.length} ملفات تم رفعها بنجاح`);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
        case 'folder': return <Folder className="text-yellow-500 w-12 h-12" fill="currentColor" fillOpacity={0.2} />;
        case 'image': return <ImageIcon className="text-purple-500 w-10 h-10" />;
        case 'excel': return <FileSpreadsheet className="text-green-600 w-10 h-10" />;
        default: return <FileText className="text-gray-400 w-10 h-10" />;
    }
  };

  const navigateToFolder = (folderId: string) => {
      setCurrentPath([...currentPath, folderId]);
  };

  const navigateUp = () => {
      const newPath = [...currentPath];
      newPath.pop();
      setCurrentPath(newPath);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
       <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الأرشيف الإلكتروني</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة الملفات والمستندات</p>
         </div>
       </div>

       {/* Breadcrumbs & Actions */}
       <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
             <span 
                className="cursor-pointer hover:text-primary-600 font-bold"
                onClick={() => setCurrentPath([])}
             >
                الرئيسية
             </span>
             {currentPath.map((folderId, idx) => (
                 <React.Fragment key={folderId}>
                    <ChevronRight size={14} />
                    <span className="font-bold">{files.find(f => f.id === folderId)?.name}</span>
                 </React.Fragment>
             ))}
          </div>
          <div className="relative">
             <input type="text" placeholder="بحث في الملفات..." className="pl-8 pr-4 py-2 border rounded-lg text-sm dark:bg-dark-800 dark:border-dark-700 dark:text-white" />
             <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
       </div>

       {/* Drop Zone / File Grid */}
       <div 
         className={`flex-1 bg-white dark:bg-dark-900 rounded-2xl shadow-sm border-2 border-dashed p-6 transition-colors overflow-y-auto ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-700'}`}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}
       >
          {displayedFiles.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Upload size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                <p className="font-bold text-lg">اسحب الملفات هنا لرفعها</p>
                <p className="text-sm">أو هذا المجلد فارغ</p>
             </div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {currentPath.length > 0 && (
                    <div 
                        onClick={navigateUp}
                        className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ChevronRight className="rotate-180 text-gray-400" size={32} />
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">رجوع</span>
                    </div>
                )}
                
                {displayedFiles.map(file => (
                    <div 
                       key={file.id}
                       onClick={() => file.type === 'folder' && navigateToFolder(file.id)}
                       className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-all border border-transparent hover:border-primary-200 hover:shadow-md group relative"
                    >
                        {getFileIcon(file.type)}
                        <div className="text-center w-full">
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate w-full">{file.name}</p>
                            <p className="text-[10px] text-gray-400">{file.date} {file.size && `• ${file.size}`}</p>
                        </div>
                        {/* FIXED: High contrast button for options */}
                        <button className="absolute top-2 right-2 p-1 bg-gray-200 dark:bg-dark-600 hover:bg-white dark:hover:bg-dark-500 rounded-full transition-all text-gray-600 dark:text-gray-300 shadow-sm">
                            <MoreVertical size={14} />
                        </button>
                    </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};

export default Files;
