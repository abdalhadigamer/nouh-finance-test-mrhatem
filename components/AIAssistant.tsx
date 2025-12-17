
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, RefreshCcw, Briefcase, DollarSign, AlertCircle } from 'lucide-react';
import { Project, Transaction, Invoice, ProjectStatus, TransactionType, User } from '../types';
import { formatCurrency } from '../services/dataService';

interface AIAssistantProps {
  projects: Project[];
  transactions: Transaction[];
  invoices: Invoice[];
  currentUser?: User | null;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  time: string;
  type?: 'text' | 'stats' | 'alert';
}

const AIAssistant: React.FC<AIAssistantProps> = ({ projects, transactions, invoices, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      text: 'مرحباً بك! أنا مساعد نوح الذكي 🤖. كيف يمكنني مساعدتك اليوم في إدارة مشاريعك وأموالك؟', 
      sender: 'ai', 
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const generateResponse = (query: string) => {
    const q = query.toLowerCase();
    
    // --- Logic 1: Project Queries ---
    if (q.includes('مشاريع') || q.includes('مشروع')) {
      const activeCount = projects.filter(p => p.status === ProjectStatus.EXECUTION).length;
      const designCount = projects.filter(p => p.status === ProjectStatus.DESIGN).length;
      return `لديك حالياً ${activeCount} مشاريع قيد التنفيذ و ${designCount} في مرحلة التصميم. هل تود معرفة تفاصيل مشروع محدد؟`;
    }

    // --- Logic 2: Financial/Balance Queries ---
    if (q.includes('رصيد') || q.includes('كاش') || q.includes('سيولة') || q.includes('فلوس')) {
      const income = transactions.filter(t => t.type === TransactionType.RECEIPT).reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === TransactionType.PAYMENT).reduce((s, t) => s + t.amount, 0);
      const balance = income - expenses;
      return `الوضع المالي العام للنظام:\n- إجمالي المقبوضات: ${formatCurrency(income)}\n- إجمالي المصروفات: ${formatCurrency(expenses)}\n- صافي السيولة (الرصيد): ${formatCurrency(balance)}`;
    }

    // --- Logic 3: Overdue/Alerts ---
    if (q.includes('تنبيه') || q.includes('مشاكل') || q.includes('متأخر')) {
      const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
      if (overdueInvoices.length > 0) {
        return `يوجد ${overdueInvoices.length} فواتير متأخرة السداد. يرجى مراجعة قسم الفواتير.`;
      }
      return 'الأمور طيبة! لا توجد تنبيهات حرجة أو فواتير متأخرة حالياً.';
    }

    // --- Logic 4: Greetings ---
    if (q.includes('هلا') || q.includes('مرحبا') || q.includes('السلام')) {
      return `أهلاً بك يا ${currentUser?.name || 'صديقي'}! جاهز للعمل. يمكنك سؤالي عن "رصيد الشركة"، "حالة المشاريع"، أو "التنبيهات".`;
    }

    // --- Default ---
    return 'عذراً، لم أفهم طلبك تماماً. أنا ما زلت أتعلم! جرب سؤالي عن: "كم الرصيد الحالي؟" أو "ما هي المشاريع النشطة؟".';
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const responseText = generateResponse(userMsg.text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const suggestedPrompts = [
    { label: '💰 كم الرصيد الحالي؟', query: 'كم الرصيد المالي الحالي؟' },
    { label: '🏗️ حالة المشاريع', query: 'ما هي حالة المشاريع الحالية؟' },
    { label: '⚠️ التنبيهات', query: 'هل يوجد تنبيهات أو متأخرات؟' },
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border-4 border-white dark:border-dark-800 ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-gradient-to-r from-violet-600 to-indigo-600 animate-pulse-slow'}`}
      >
        {isOpen ? <X className="text-white" /> : <Sparkles className="text-white" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[350px] md:w-[400px] h-[500px] bg-white dark:bg-dark-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 font-cairo" dir="rtl">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Bot className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">مساعد نوح</h3>
                <p className="text-indigo-100 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  متصل الآن (نسخة تجريبية)
                </p>
              </div>
            </div>
            <button onClick={() => setMessages([])} className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors" title="مسح المحادثة">
              <RefreshCcw size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-950/50 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative 
                    ${msg.sender === 'user' 
                      ? 'bg-violet-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-dark-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-dark-700 rounded-bl-none'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[10px] block mt-1 ${msg.sender === 'user' ? 'text-violet-200' : 'text-gray-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-dark-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-dark-700 flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length < 3 && (
            <div className="px-4 pb-2 bg-gray-50 dark:bg-dark-950/50 flex gap-2 overflow-x-auto no-scrollbar">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInput(prompt.query); handleSend(); }}
                  className="whitespace-nowrap text-xs bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-violet-50 dark:hover:bg-dark-700 hover:border-violet-200 transition-colors shadow-sm"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 bg-gray-100 dark:bg-dark-800 border-transparent focus:bg-white dark:focus:bg-dark-950 border focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all dark:text-white"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white p-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
