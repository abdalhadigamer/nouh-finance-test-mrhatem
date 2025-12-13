
import React, { useState } from 'react';
import { MOCK_DAILY_REPORTS, MOCK_ATTENDANCE } from '../constants';
import { DailyReport, Employee, Task } from '../types';
import { Calendar, CheckCircle, Clock, FileText, Star, AlertTriangle, Flag, Save } from 'lucide-react';
import Modal from './Modal';

interface ManagerReportsProps {
  employees: Employee[];
}

const ManagerReports: React.FC<ManagerReportsProps> = ({ employees }) => {
  // Helper to get local YYYY-MM-DD
  const getLocalToday = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalToday()); 
  
  // Initialize state with mocks to allow updates in UI
  const [reports, setReports] = useState<DailyReport[]>(MOCK_DAILY_REPORTS);
  
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [reportInEdit, setReportInEdit] = useState<DailyReport | null>(null);

  const handleOpenReport = (report: DailyReport) => {
    setSelectedReport(report);
    // Create a deep copy for editing
    setReportInEdit(JSON.parse(JSON.stringify(report)));
  };

  const handleCloseReport = () => {
    setSelectedReport(null);
    setReportInEdit(null);
  };

  const handleRateTask = (taskId: string, rating: number) => {
    if (!reportInEdit) return;
    const updatedTasks = reportInEdit.completedTasks.map(t => 
      t.id === taskId ? { ...t, managerRating: rating } : t
    );
    setReportInEdit({ ...reportInEdit, completedTasks: updatedTasks });
  };

  const handleTogglePriority = (planId: string) => {
    if (!reportInEdit) return;
    const updatedPlans = reportInEdit.planForTomorrow.map(p => 
      p.id === planId ? { ...p, isPriority: !p.isPriority } : p
    );
    setReportInEdit({ ...reportInEdit, planForTomorrow: updatedPlans });
  };

  const handleSaveReview = () => {
    if (!reportInEdit) return;
    
    // Update the local state
    const finalReport = { ...reportInEdit, status: 'Reviewed' as const };
    
    const updatedReports = reports.map(r => 
      r.id === finalReport.id ? finalReport : r
    );

    setReports(updatedReports);
    
    // NEW: Update Mock Data for persistence
    const mockIndex = MOCK_DAILY_REPORTS.findIndex(r => r.id === finalReport.id);
    if (mockIndex !== -1) {
        MOCK_DAILY_REPORTS[mockIndex] = finalReport;
    }
    
    alert(`تم حفظ تقييم الموظف ${finalReport.employeeName} واعتماد الخطة.`);
    handleCloseReport();
  };

  // Filter employees based on attendance for the selected date
  const getAttendanceStatus = (empId: string) => {
    return MOCK_ATTENDANCE.find(r => r.employeeId === empId && r.date === selectedDate);
  };

  const reportsForDate = reports.filter(r => r.date === selectedDate);

  const totalEmployees = employees.length;
  const submittedReports = reportsForDate.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">متابعة الدوام والتقارير</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">مراقبة حضور الموظفين وتقييم إنجازاتهم اليومية</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-dark-900 p-2 rounded-lg border border-gray-200 dark:border-dark-800 shadow-sm">
           <Calendar className="text-gray-400" size={20} />
           <input 
             type="date" 
             className="outline-none text-gray-600 dark:text-gray-300 text-sm bg-transparent"
             value={selectedDate}
             onChange={(e) => setSelectedDate(e.target.value)}
           />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">الموظفين الحاضرين</p>
             <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
               {MOCK_ATTENDANCE.filter(a => a.date === selectedDate).length} <span className="text-sm font-normal text-gray-400">/ {totalEmployees}</span>
             </h3>
           </div>
           <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
             <Clock size={24} />
           </div>
        </div>
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">التقارير المستلمة</p>
             <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
               {submittedReports} <span className="text-sm font-normal text-gray-400">/ {totalEmployees}</span>
             </h3>
           </div>
           <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
             <FileText size={24} />
           </div>
        </div>
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">تقارير بانتظار المراجعة</p>
             <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
               {reportsForDate.filter(r => r.status === 'Submitted').length}
             </h3>
           </div>
           <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full">
             <AlertTriangle size={24} />
           </div>
        </div>
      </div>

      {/* Report List */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
         <div className="p-6 border-b border-gray-100 dark:border-dark-800">
            <h3 className="font-bold text-gray-800 dark:text-white">سجل التقارير اليومية ({selectedDate})</h3>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-right">
             <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
               <tr>
                 <th className="px-6 py-4">الموظف</th>
                 <th className="px-6 py-4">الحضور</th>
                 <th className="px-6 py-4">حالة التقرير</th>
                 <th className="px-6 py-4">عدد المهام المنجزة</th>
                 <th className="px-6 py-4">الإجراء</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
               {employees.map(emp => {
                 const report = reportsForDate.find(r => r.employeeId === emp.id);
                 const attendance = getAttendanceStatus(emp.id);

                 return (
                   <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full border border-gray-200 dark:border-dark-700" />
                         <span className="font-medium text-gray-800 dark:text-gray-200">{emp.name}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                        {attendance ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${attendance.status === 'Late' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                            {attendance.status === 'Present' ? 'حاضر' : 'متأخر'} ({attendance.clockIn})
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">غائب</span>
                        )}
                     </td>
                     <td className="px-6 py-4">
                        {report ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${report.status === 'Reviewed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                            {report.status === 'Reviewed' ? 'تم التقييم' : 'بانتظار المراجعة'}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">لم يرسل</span>
                        )}
                     </td>
                     <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {report ? report.completedTasks.length : '-'}
                     </td>
                     <td className="px-6 py-4">
                        {report ? (
                          <button 
                            onClick={() => handleOpenReport(report)}
                            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                          >
                            عرض وتقييم
                          </button>
                        ) : (
                          <span className="text-gray-400 italic text-xs">لم يرسل</span>
                        )}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
      </div>

      {/* Review Modal */}
      {selectedReport && reportInEdit && (
        <Modal isOpen={!!selectedReport} onClose={handleCloseReport} title={`مراجعة تقرير: ${reportInEdit.employeeName}`}>
           <div className="space-y-6">
              {/* Completed Tasks */}
              <div>
                 <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                   <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                   إنجازات اليوم (يرجى التقييم)
                 </h4>
                 <div className="space-y-3">
                    {reportInEdit.completedTasks.map(task => (
                      <div key={task.id} className="bg-gray-50 dark:bg-dark-800 p-3 rounded-lg border border-gray-100 dark:border-dark-700 hover:border-primary-200 transition-colors">
                         <div className="flex justify-between items-start">
                            <p className="text-gray-800 dark:text-gray-200 font-medium text-sm w-2/3">{task.description}</p>
                            <div className="flex gap-1">
                               {[1, 2, 3, 4, 5].map(star => (
                                 <button
                                   key={star}
                                   type="button"
                                   onClick={() => handleRateTask(task.id, star)}
                                   className="focus:outline-none transition-transform hover:scale-110"
                                 >
                                    <Star 
                                      size={16} 
                                      className={`${task.managerRating && task.managerRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                                    />
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Future Plans */}
              <div>
                 <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                   <Calendar className="text-primary-600 dark:text-primary-400" size={18} />
                   خطة الغد (تحديد الأولويات)
                 </h4>
                 <div className="space-y-3">
                    {reportInEdit.planForTomorrow.map(plan => (
                      <div 
                        key={plan.id} 
                        className={`p-3 rounded-lg border flex justify-between items-center transition-all ${plan.isPriority ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 shadow-sm' : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700'}`}
                      >
                         <div className="flex items-center gap-2">
                            {plan.isPriority && <AlertTriangle size={14} className="text-red-500" />}
                            <p className={`${plan.isPriority ? 'text-red-800 dark:text-red-300 font-medium' : 'text-gray-700 dark:text-gray-300'} text-sm`}>
                              {plan.description}
                            </p>
                         </div>
                         <button 
                           onClick={() => handleTogglePriority(plan.id)}
                           className={`p-2 rounded-full transition-colors ${plan.isPriority ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-600'}`}
                           title={plan.isPriority ? "إلغاء الأولوية" : "تحديد كأولوية قصوى"}
                         >
                           <Flag size={18} fill={plan.isPriority ? "currentColor" : "none"} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-dark-700 flex gap-3">
                 <button 
                   onClick={handleSaveReview}
                   className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
                 >
                   <Save size={18} />
                   حفظ التقييم واعتماد الخطة
                 </button>
                 <button 
                   onClick={handleCloseReport}
                   className="flex-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-dark-700"
                 >
                   إلغاء
                 </button>
              </div>
           </div>
        </Modal>
      )}
    </div>
  );
};

export default ManagerReports;
