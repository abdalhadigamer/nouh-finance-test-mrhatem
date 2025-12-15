import React, { useState } from 'react';
import { Employee, PayrollRecord } from '../types';
import { MOCK_PAYROLL, MOCK_DAILY_REPORTS, MOCK_ATTENDANCE } from '../constants';
import { formatCurrency } from '../services/dataService';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Banknote, 
  LogOut, 
  Clock, 
  Download, 
  Wallet, 
  Calendar,
  CheckCircle
} from 'lucide-react';

interface EmployeePortalProps {
  employee: Employee;
  onLogout: () => void;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ employee, onLogout }) => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tasks' | 'payroll'>('dashboard');
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>(new Date().toLocaleString('ar-SA', { month: 'long' }));

  // Derived Data
  const currentPayroll = MOCK_PAYROLL.find(p => 
    p.employeeId === employee.id && 
    p.month === selectedPayrollMonth
  );

  const myTasks = MOCK_DAILY_REPORTS
    .filter(r => r.employeeId === employee.id)
    .flatMap(r => r.planForTomorrow || []) // Simplified: getting tasks from reports
    .filter(t => !t.isCompleted); 
    
  const todayAttendance = MOCK_ATTENDANCE.find(a => 
      a.employeeId === employee.id && 
      a.date === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="min-h-screen bg-gray-50 font-cairo text-right" dir="rtl">
        {/* Header */}
        <header className="bg-primary-900 text-white shadow-lg sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img 
                        src={employee.avatar} 
                        alt={employee.name} 
                        className="w-10 h-10 rounded-full border-2 border-primary-400 bg-white"
                    />
                    <div>
                        <h1 className="text-lg font-bold">بوابة الموظف</h1>
                        <p className="text-xs text-primary-200">مرحباً، {employee.name}</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-red-500/20"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">تسجيل خروج</span>
                </button>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                <button 
                    onClick={() => setActiveSection('dashboard')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeSection === 'dashboard' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    <LayoutDashboard size={20} />
                    لوحة المعلومات
                </button>
                <button 
                    onClick={() => setActiveSection('tasks')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeSection === 'tasks' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    <CheckSquare size={20} />
                    مهامي
                </button>
                <button 
                    onClick={() => setActiveSection('payroll')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeSection === 'payroll' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    <Banknote size={20} />
                    الرواتب
                </button>
            </div>

            {/* Content */}
            {activeSection === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Welcome Card */}
                    <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-2">يوم سعيد، {employee.name.split(' ')[0]}!</h2>
                            <p className="text-primary-100 mb-6 max-w-lg">نتمنى لك يوماً مليئاً بالإنجازات. إليك نظرة سريعة على حالتك اليوم.</p>
                            
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                    <p className="text-xs text-primary-200 mb-1">حالة الحضور</p>
                                    <p className="font-bold flex items-center gap-2">
                                        {todayAttendance ? (
                                            <>
                                                <CheckCircle className="text-green-400" size={16} />
                                                <span className="text-green-100">تم تسجيل الحضور ({todayAttendance.clockIn})</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="text-yellow-400" size={16} />
                                                <span className="text-yellow-100">لم يتم التسجيل بعد</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                    <p className="text-xs text-primary-200 mb-1">الرصيد (العهدة)</p>
                                    <p className="font-bold flex items-center gap-2">
                                        <Wallet className="text-blue-300" size={16} />
                                        <span>{formatCurrency(employee.pettyCashBalance || 0)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CheckSquare className="text-primary-600" size={20} /> المهام المفتوحة
                             </h3>
                             {myTasks.length > 0 ? (
                                 <ul className="space-y-3">
                                     {myTasks.slice(0, 3).map((task, idx) => (
                                         <li key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                             <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                             <span className="text-sm text-gray-700">{task.description}</span>
                                         </li>
                                     ))}
                                     {myTasks.length > 3 && <li className="text-xs text-gray-400 pt-1">+ {myTasks.length - 3} مهام أخرى</li>}
                                 </ul>
                             ) : (
                                 <div className="text-center py-8 text-gray-400">
                                     <CheckCircle size={40} className="mx-auto mb-2 opacity-20" />
                                     <p>لا توجد مهام معلقة</p>
                                 </div>
                             )}
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar className="text-primary-600" size={20} /> آخر الرواتب
                             </h3>
                             {MOCK_PAYROLL.filter(p => p.employeeId === employee.id).slice(0, 2).map(pay => (
                                 <div key={pay.id} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0">
                                     <div>
                                         <p className="font-bold text-gray-800">{pay.month} {pay.year}</p>
                                         <p className="text-xs text-gray-500">{pay.status === 'Paid' ? 'تم التحويل' : 'تحت المعالجة'}</p>
                                     </div>
                                     <span className="font-bold text-primary-600">{formatCurrency(pay.netSalary)}</span>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'tasks' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CheckSquare className="text-primary-600" /> مهامي
                    </h2>
                    {myTasks.length > 0 ? (
                        <ul className="space-y-3">
                            {myTasks.map((task, idx) => (
                                <li key={idx} className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${task.isPriority ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                        <span className="text-gray-800 font-medium">{task.description}</span>
                                        {task.isPriority && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">أولوية</span>}
                                    </div>
                                    <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100">
                                        تحديث الحالة
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                            <p>لا توجد مهام نشطة حالياً</p>
                        </div>
                    )}
                </div>
            )}

            {/* Payroll Section */}
            {activeSection === 'payroll' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Banknote className="text-primary-600"/> مسير الرواتب</h2>
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                            <span className="text-sm font-bold text-gray-600">اختر الشهر:</span>
                            <select 
                            value={selectedPayrollMonth} 
                            onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                            className="bg-transparent font-bold text-gray-800 outline-none text-sm cursor-pointer"
                            >
                                <option value="يناير">يناير</option>
                                <option value="فبراير">فبراير</option>
                                <option value="مارس">مارس</option>
                                <option value="أبريل">أبريل</option>
                                <option value="مايو">مايو</option>
                                <option value="يونيو">يونيو</option>
                            </select>
                        </div>
                    </div>

                    {currentPayroll ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-3xl mx-auto print:shadow-none print:border-none">
                            <div className="bg-primary-900 text-white p-6 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold">قسيمة راتب</h3>
                                    <p className="text-primary-200 text-sm mt-1">شهر {currentPayroll.month} {currentPayroll.year}</p>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-lg">{employee.name}</p>
                                    <p className="text-xs text-primary-300">{employee.role}</p>
                                </div>
                            </div>
                            
                            <div className="p-8">
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-green-700 border-b border-green-100 pb-2 mb-2">المستحقات</h4>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">الراتب الأساسي</span>
                                            <span className="font-bold">{formatCurrency(currentPayroll.basicSalary)}</span>
                                        </div>
                                        {currentPayroll.allowanceList?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{item.name}</span>
                                                <span className="font-bold text-green-600">+{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-red-700 border-b border-red-100 pb-2 mb-2">الخصومات</h4>
                                        {currentPayroll.deductionList?.length > 0 ? (
                                            currentPayroll.deductionList.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{item.name}</span>
                                                    <span className="font-bold text-red-600">-{formatCurrency(item.amount)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-400 italic">لا توجد خصومات</div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-200">
                                    <span className="font-bold text-gray-800 text-lg">صافي الراتب</span>
                                    <span className="font-bold text-2xl text-primary-700">{formatCurrency(currentPayroll.netSalary)}</span>
                                </div>

                                <div className="mt-8 text-center">
                                    <button className="flex items-center justify-center gap-2 text-primary-600 font-bold hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors mx-auto">
                                        <Download size={18}/>
                                        تحميل كملف PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                            <Wallet size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>لم يتم إصدار قسيمة راتب لشهر {selectedPayrollMonth} بعد.</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    </div>
  );
};

export default EmployeePortal;