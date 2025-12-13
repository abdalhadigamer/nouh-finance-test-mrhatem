
import React, { useState, useEffect } from 'react';
import { Employee, Invoice, InvoiceType, AttendanceRecord } from '../types';
import { MOCK_INVOICES, MOCK_PROJECTS, MOCK_ATTENDANCE } from '../constants';
import { formatCurrency } from '../services/dataService';
import { 
  LogOut, 
  Wallet, 
  PlusCircle, 
  FileText, 
  History, 
  AlertCircle,
  Camera,
  CheckCircle,
  Play,
  Square,
  ListTodo,
  Send,
  Plus,
  Clock
} from 'lucide-react';
import Modal from './Modal';

interface EmployeePortalProps {
  employee: Employee;
  onLogout: () => void;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ employee, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'expenses'>('attendance');
  
  // Petty Cash State
  const [balance, setBalance] = useState(employee.pettyCashBalance || 0);
  const [myExpenses, setMyExpenses] = useState<Invoice[]>(
    MOCK_INVOICES.filter(inv => inv.relatedEmployeeId === employee.id)
  );

  // Attendance State
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(null);
  const [timer, setTimer] = useState<string>('00:00:00');
  const [isClockedIn, setIsClockedIn] = useState(false);

  // Daily Report State
  const [todayTasks, setTodayTasks] = useState<string[]>(['']);
  const [tomorrowPlans, setTomorrowPlans] = useState<string[]>(['']);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    category: '',
    projectId: '',
    description: ''
  });

  // Helper to get local YYYY-MM-DD
  const getLocalToday = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  useEffect(() => {
    // Check if user has ANY record for today (active or completed)
    const today = getLocalToday();
    // Find record in the source of truth (MOCK_ATTENDANCE)
    const existingRecord = MOCK_ATTENDANCE.find(r => r.employeeId === employee.id && r.date === today);
    
    if (existingRecord) {
      setCurrentAttendance(existingRecord);
      // If no clockOut time, they are still working
      if (!existingRecord.clockOut) {
        setIsClockedIn(true);
      } else {
        setIsClockedIn(false); // Work day finished
      }
    } else {
      setIsClockedIn(false);
      setCurrentAttendance(null);
    }
  }, [employee.id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isClockedIn && currentAttendance && !currentAttendance.clockOut) {
      interval = setInterval(() => {
        // Construct date object safely
        const todayStr = getLocalToday();
        const startTime = new Date(`${todayStr}T${currentAttendance.clockIn}:00`).getTime();
        const now = new Date().getTime();
        const diff = now - startTime;
        
        if (diff > 0) {
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          
          setTimer(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, currentAttendance]);

  const handleClockIn = () => {
    const now = new Date();
    // Format HH:MM
    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); 
    const today = getLocalToday();
    
    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: employee.id,
      date: today,
      clockIn: timeString,
      status: 'Present'
    };
    
    // 1. Update Mock Data (Backend Simulation)
    MOCK_ATTENDANCE.push(record);

    // 2. Update Local State
    setCurrentAttendance(record);
    setIsClockedIn(true);
  };

  const handleClockOut = () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      if (currentAttendance) {
        const updatedRecord: AttendanceRecord = {
            ...currentAttendance,
            clockOut: timeString,
            totalHours: 8 // Placeholder for calculated hours
        };
        
        // 1. Update Mock Data (Backend Simulation)
        const index = MOCK_ATTENDANCE.findIndex(r => r.id === currentAttendance.id);
        if (index !== -1) {
            MOCK_ATTENDANCE[index] = updatedRecord;
        }

        // 2. Update Local State
        setCurrentAttendance(updatedRecord);
        setIsClockedIn(false);
      }
      
      alert('تم تسجيل الانصراف بنجاح. يوم سعيد!');
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newExpense.amount > balance) {
      alert("عفواً، رصيد العهدة غير كافي!");
      return;
    }

    const expense: Invoice = {
      id: `exp-${Date.now()}`,
      invoiceNumber: `EXP-${Math.floor(Math.random() * 1000)}`,
      date: getLocalToday(),
      projectId: newExpense.projectId || 'General',
      amount: newExpense.amount,
      type: InvoiceType.PURCHASE,
      category: newExpense.category,
      status: 'Paid',
      supplierOrClient: employee.name,
      relatedEmployeeId: employee.id
    };

    setMyExpenses([expense, ...myExpenses]);
    setBalance(prev => prev - newExpense.amount);
    setIsModalOpen(false);
    setNewExpense({ amount: 0, category: '', projectId: '', description: '' });
  };

  const handleTaskChange = (index: number, value: string, type: 'today' | 'tomorrow') => {
    if (type === 'today') {
      const updated = [...todayTasks];
      updated[index] = value;
      setTodayTasks(updated);
    } else {
      const updated = [...tomorrowPlans];
      updated[index] = value;
      setTomorrowPlans(updated);
    }
  };

  const addTaskField = (type: 'today' | 'tomorrow') => {
    if (type === 'today') setTodayTasks([...todayTasks, '']);
    else setTomorrowPlans([...tomorrowPlans, '']);
  };

  const submitDailyReport = () => {
    setReportSubmitted(true);
    alert("تم إرسال التقرير اليومي بنجاح إلى المدير المباشر.");
  };

  // Helper to check if work day is finished
  const isWorkDayFinished = currentAttendance && currentAttendance.clockOut;

  return (
    <div className="min-h-screen bg-gray-50 font-cairo">
      {/* Header */}
      <header className="bg-secondary-900 text-white shadow-md">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary-500 overflow-hidden">
               <img src={employee.avatar} alt="User" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold">{employee.name}</h1>
              <p className="text-[10px] text-gray-400">{employee.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
           <button 
             onClick={() => setActiveTab('attendance')}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'attendance' ? 'bg-primary-600 text-white shadow' : 'text-gray-500'}`}
           >
             <Clock size={16} />
             الدوام والتقارير
           </button>
           <button 
             onClick={() => setActiveTab('expenses')}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'expenses' ? 'bg-primary-600 text-white shadow' : 'text-gray-500'}`}
           >
             <Wallet size={16} />
             العهدة المالية
           </button>
        </div>

        {/* Tab Content: Attendance & Reports */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             
             {/* Clock In/Out Card */}
             <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center">
                <p className="text-gray-500 text-sm mb-2">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                
                {isWorkDayFinished ? (
                  <div className="py-6 animate-in zoom-in duration-300">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">تم إنهاء عمل اليوم</h3>
                    <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm flex justify-center gap-6">
                      <div>
                        <p className="text-gray-400 text-xs">وقت الحضور</p>
                        <p className="font-bold text-gray-800">{currentAttendance?.clockIn}</p>
                      </div>
                      <div className="w-px bg-gray-200"></div>
                      <div>
                        <p className="text-gray-400 text-xs">وقت الانصراف</p>
                        <p className="font-bold text-gray-800">{currentAttendance?.clockOut}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-5xl font-mono font-bold text-gray-800 mb-6 tracking-wider">
                      {isClockedIn ? timer : new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'})}
                    </div>

                    {!isClockedIn ? (
                      <button 
                        onClick={handleClockIn}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Play size={24} fill="currentColor" />
                        تسجيل دخول (بدء العمل)
                      </button>
                    ) : (
                      <button 
                        onClick={handleClockOut}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Square size={24} fill="currentColor" />
                        تسجيل خروج (إنهاء العمل)
                      </button>
                    )}
                  </>
                )}
             </div>

             {/* Daily Report Form */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <ListTodo className="text-primary-600" />
                  <h3 className="font-bold text-gray-800">التقرير اليومي</h3>
                </div>

                {!reportSubmitted ? (
                  <div className="space-y-6">
                    {/* Tasks Done Today */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">ما تم إنجازه اليوم</label>
                      <div className="space-y-2">
                        {todayTasks.map((task, idx) => (
                          <input 
                            key={idx}
                            type="text" 
                            placeholder={`مهمة رقم ${idx + 1}`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            value={task}
                            onChange={(e) => handleTaskChange(idx, e.target.value, 'today')}
                          />
                        ))}
                        <button onClick={() => addTaskField('today')} className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:underline">
                          <Plus size={12} /> إضافة مهمة أخرى
                        </button>
                      </div>
                    </div>

                    {/* Plan for Tomorrow */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">خطة الغد (الأعمال المستهدفة)</label>
                      <div className="space-y-2">
                        {tomorrowPlans.map((plan, idx) => (
                          <input 
                            key={idx}
                            type="text" 
                            placeholder={`خطة رقم ${idx + 1}`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            value={plan}
                            onChange={(e) => handleTaskChange(idx, e.target.value, 'tomorrow')}
                          />
                        ))}
                        <button onClick={() => addTaskField('tomorrow')} className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:underline">
                          <Plus size={12} /> إضافة خطة أخرى
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={submitDailyReport}
                      className="w-full bg-secondary-900 text-white py-3 rounded-xl font-bold hover:bg-secondary-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      إرسال التقرير للمدير
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                      <CheckCircle size={32} />
                    </div>
                    <h4 className="font-bold text-gray-800">تم إرسال التقرير</h4>
                    <p className="text-gray-500 text-sm mt-1">شكراً لجهودك، سيقوم المدير بمراجعة التقرير قريباً.</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Tab Content: Expenses (Petty Cash) */}
        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Balance Card */}
            <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mb-10"></div>
              
              <p className="text-primary-100 text-sm mb-2 flex items-center gap-2">
                <Wallet size={16} />
                رصيد العهدة الحالي
              </p>
              <h2 className="text-4xl font-bold mb-4">{formatCurrency(balance)}</h2>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-white text-primary-800 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <PlusCircle size={20} />
                تسجيل مصروف جديد
              </button>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                المبالغ التي تقوم بصرفها يتم خصمها مباشرة من عهدتك. يرجى التأكد من الاحتفاظ بالفواتير الورقية وتسليمها للمحاسبة.
              </p>
            </div>

            {/* Expenses List */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <History size={18} className="text-gray-500" />
                سجل المصروفات
              </h3>
              
              <div className="space-y-3">
                {myExpenses.length > 0 ? (
                  myExpenses.map(exp => (
                    <div key={exp.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-50 p-2 rounded-lg text-red-500">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{exp.category}</p>
                            <p className="text-xs text-gray-500">{exp.date}</p>
                            {exp.projectId !== 'General' && (
                              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 mt-1 inline-block">
                                مشروع #{exp.projectId}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-red-600">
                          -{formatCurrency(exp.amount)}
                        </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    لا توجد مصروفات مسجلة
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تسجيل مصروف عهدة">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
            <input 
              required
              type="number"
              max={balance}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-xl font-bold text-center"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">الرصيد المتوفر: {formatCurrency(balance)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع المصروف / البيان</label>
            <input 
              required
              type="text" 
              placeholder="مثال: وقود، ضيافة، أدوات مكتبية..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={newExpense.category}
              onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المشروع (اختياري)</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
              value={newExpense.projectId}
              onChange={(e) => setNewExpense({...newExpense, projectId: e.target.value})}
            >
              <option value="">عام / إداري</option>
              {MOCK_PROJECTS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer">
             <Camera size={32} className="mb-2" />
             <span className="text-sm">التقاط / رفع صورة الفاتورة</span>
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-primary-500/30"
          >
            خصم من العهدة وحفظ
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeePortal;
