
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from '../services/dataService';
import { MOCK_PROJECTS } from '../constants';
import { Download, Calendar, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';

const Reports: React.FC = () => {
  // Mock Data for Reports
  const profitLossData = [
    { name: 'يناير', إيرادات: 400000, مصروفات: 240000, ربح: 160000 },
    { name: 'فبراير', إيرادات: 300000, مصروفات: 139800, ربح: 160200 },
    { name: 'مارس', إيرادات: 200000, مصروفات: 280000, ربح: -80000 },
    { name: 'أبريل', إيرادات: 278000, مصروفات: 190800, ربح: 87200 },
    { name: 'مايو', إيرادات: 589000, مصروفات: 380000, ربح: 209000 },
  ];

  const expenseCategoryData = [
    { name: 'مواد بناء', value: 45 },
    { name: 'رواتب', value: 25 },
    { name: 'معدات', value: 15 },
    { name: 'نقل', value: 10 },
    { name: 'خدمات', value: 5 },
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Project Profitability Logic
  const projectPerformance = MOCK_PROJECTS.map(p => ({
    name: p.name,
    budget: p.budget,
    profit: p.revenue - p.expenses,
    margin: p.revenue > 0 ? ((p.revenue - p.expenses) / p.revenue) * 100 : 0
  })).sort((a, b) => b.profit - a.profit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">التقارير المالية</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">تحليل الأداء المالي، الأرباح، والمصاريف</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
             <Calendar size={18} />
             <span>مايو 2024</span>
           </button>
           <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
             <Download size={18} />
             <span>تصدير PDF</span>
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
            <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">صافي الربح (السنوي)</h4>
            <div className="flex items-end gap-3">
               <span className="text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(536400)}</span>
               <span className="text-green-500 text-sm font-bold flex items-center mb-1">
                 <TrendingUp size={14} /> 12%
               </span>
            </div>
         </div>
         <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
            <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">إجمالي المصروفات</h4>
            <div className="flex items-end gap-3">
               {/* Expenses: Blue */}
               <span className="text-3xl font-bold text-blue-600">{formatCurrency(1230600)}</span>
               <span className="text-blue-500 text-sm font-bold flex items-center mb-1">
                 <TrendingDown size={14} /> 5%
               </span>
            </div>
         </div>
         <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
            <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">متوسط هامش الربح</h4>
            <div className="flex items-end gap-3">
               <span className="text-3xl font-bold text-purple-600">18.5%</span>
            </div>
         </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit & Loss Chart */}
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={20} />
            تحليل الإيرادات والمصروفات
          </h3>
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitLossData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                <XAxis dataKey="name" tick={{fill: '#9ca3af'}} />
                <YAxis tick={{fill: '#9ca3af'}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                   cursor={{fill: '#f3f4f6'}}
                />
                <Legend />
                <Bar dataKey="إيرادات" fill="#22c55e" radius={[4, 4, 0, 0]} />
                {/* Expenses: Blue */}
                <Bar dataKey="مصروفات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="text-primary-600" size={20} />
            توزيع المصروفات
          </h3>
          <div className="h-80 w-full flex items-center justify-center" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project Profitability Table */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-dark-800">
          <h3 className="font-bold text-gray-800 dark:text-white">ربحية المشاريع</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">المشروع</th>
                <th className="px-6 py-4">قيمة العقد</th>
                <th className="px-6 py-4">صافي الربح (المحقق)</th>
                <th className="px-6 py-4">هامش الربح</th>
                <th className="px-6 py-4">الأداء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {projectPerformance.map((project, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{project.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatCurrency(project.budget)}</td>
                  {/* Red only if Negative */}
                  <td className={`px-6 py-4 font-bold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(project.profit)}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{project.margin.toFixed(1)}%</td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-gray-200 dark:bg-dark-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${project.profit > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min(Math.abs(project.margin), 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
