
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_CLIENTS } from '../constants';
import { Client } from '../types';
import { Search, Send, MoreVertical, Phone, Video, Paperclip, Check, CheckCheck, Smile } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'client';
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: Message[];
  isOnline?: boolean;
}

const Messages: React.FC = () => {
  // Mock Data generation based on existing clients
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate mock conversations from clients
    const mocks: Conversation[] = MOCK_CLIENTS.map((client, index) => ({
      id: `conv-${client.id}`,
      clientId: client.id,
      clientName: client.name,
      avatar: client.avatar || '',
      lastMessage: index === 0 ? 'هل يمكن مراجعة المخطط الأخير؟' : 'شكراً لك مهندس فهد',
      lastTime: index === 0 ? '10:30 ص' : 'أمس',
      unreadCount: index === 0 ? 2 : 0,
      isOnline: index === 0,
      messages: [
        { id: '1', text: 'مرحباً، كيف حال العمل في المشروع؟', sender: 'me', time: '09:00 ص', status: 'read' },
        { id: '2', text: 'أهلاً مهندس، الأمور طيبة. لدي ملاحظة بسيطة.', sender: 'client', time: '09:15 ص', status: 'read' },
        { id: '3', text: 'تفضل، أنا أسمعك.', sender: 'me', time: '09:20 ص', status: 'read' },
        { id: '4', text: index === 0 ? 'هل يمكن مراجعة المخطط الأخير؟' : 'شكراً لك مهندس فهد', sender: 'client', time: index === 0 ? '10:30 ص' : 'أمس', status: 'read' }
      ]
    }));
    setConversations(mocks);
    // Select first one by default
    if (mocks.length > 0) setSelectedConversationId(mocks[0].id);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, selectedConversationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversationId) {
        return {
          ...conv,
          lastMessage: newMessage,
          lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messages: [
            ...conv.messages,
            {
              id: `msg-${Date.now()}`,
              text: newMessage,
              sender: 'me' as const,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'sent' as const
            }
          ]
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setNewMessage('');
  };

  const activeConv = conversations.find(c => c.id === selectedConversationId);

  const filteredConversations = conversations.filter(c => 
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
      
      {/* Sidebar (Conversations List) */}
      <div className="w-80 md:w-96 border-l border-gray-100 dark:border-dark-800 flex flex-col bg-gray-50 dark:bg-dark-950/30">
        <div className="p-4 border-b border-gray-100 dark:border-dark-800">
           <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">الرسائل</h2>
           <div className="relative">
             <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="بحث في المحادثات..." 
               className="w-full pl-4 pr-10 py-2 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 dark:text-white"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {filteredConversations.map(conv => (
             <div 
               key={conv.id}
               onClick={() => setSelectedConversationId(conv.id)}
               className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors ${selectedConversationId === conv.id ? 'bg-white dark:bg-dark-900 border-r-4 border-primary-600 shadow-sm' : ''}`}
             >
                <div className="relative">
                   <img src={conv.avatar} alt={conv.clientName} className="w-12 h-12 rounded-full object-cover" />
                   {conv.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-900 rounded-full"></span>}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-center mb-1">
                      <h4 className={`text-sm font-bold truncate ${selectedConversationId === conv.id ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-white'}`}>{conv.clientName}</h4>
                      <span className="text-[10px] text-gray-400">{conv.lastTime}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{conv.lastMessage}</p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-dark-900">
         {activeConv ? (
           <>
             {/* Chat Header */}
             <div className="p-4 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-white dark:bg-dark-900 z-10">
                <div className="flex items-center gap-3">
                   <img src={activeConv.avatar} alt={activeConv.clientName} className="w-10 h-10 rounded-full" />
                   <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{activeConv.clientName}</h3>
                      <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                        {activeConv.isOnline ? '● متصل الآن' : 'آخر ظهور أمس'}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-full transition-colors"><Phone size={20} /></button>
                   <button className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-full transition-colors"><Video size={20} /></button>
                   <button className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-full transition-colors"><MoreVertical size={20} /></button>
                </div>
             </div>

             {/* Messages */}
             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')]">
                {activeConv.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[70%] relative group`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                          msg.sender === 'me' 
                            ? 'bg-primary-600 text-white rounded-bl-none' 
                            : 'bg-white dark:bg-dark-800 text-gray-800 dark:text-white border border-gray-100 dark:border-dark-700 rounded-br-none'
                        }`}>
                           <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                           <span>{msg.time}</span>
                           {msg.sender === 'me' && (
                             <span>
                               {msg.status === 'read' ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />}
                             </span>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
                <div ref={chatEndRef}></div>
             </div>

             {/* Input Area */}
             <div className="p-4 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                   <button type="button" className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <Paperclip size={20} />
                   </button>
                   <div className="flex-1 bg-gray-100 dark:bg-dark-800 rounded-2xl flex items-center px-4 py-2">
                      <input 
                        type="text" 
                        placeholder="اكتب رسالتك هنا..." 
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-white py-2"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2">
                         <Smile size={20} />
                      </button>
                   </div>
                   <button 
                     type="submit" 
                     className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                     disabled={!newMessage.trim()}
                   >
                      <Send size={20} className={newMessage.trim() ? 'translate-x-0.5' : ''} />
                   </button>
                </form>
             </div>
           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
              <div className="w-24 h-24 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mb-4">
                 <Search size={48} />
              </div>
              <p className="text-lg font-bold text-gray-500 dark:text-gray-400">اختر محادثة للبدء</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default Messages;
