'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Search, Send, Image as ImageIcon, MoreVertical, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { chatApi } from '@/lib/api';

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatApi.getConversations().then(res => {
      setContacts(res.data?.data || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      chatApi.getMessages(selectedChat).then(res => setMessages(res.data?.data || [])).catch(console.error);
    }
  }, [selectedChat]);

  return (
    <div className="h-[calc(100vh-8rem)] bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.12] overflow-hidden flex animate-fade-in shadow-sm">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-white/[0.12] flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-semibold text-white mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/[0.12] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 text-white/50 animate-spin" /></div>}
          {!loading && contacts.length === 0 && (
            <div className="p-8 text-center text-white/50 text-sm">No conversations yet</div>
          )}
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedChat(contact.id)}
              className={`w-full p-4 flex items-start gap-3 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors text-left ${selectedChat === contact.id ? 'bg-primary-500/10' : ''}`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                  {(contact.name || contact.otherUser?.fullName || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm truncate">{contact.name || contact.otherUser?.fullName}</span>
                </div>
                <div className="text-xs font-medium text-primary-400 truncate mb-1">{contact.item?.itemName || 'General'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 -ml-2 text-white/60" onClick={() => setSelectedChat(null)}>
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                A
              </div>
              <div>
                <h3 className="font-semibold text-white">Aarav Sharma</h3>
                <p className="text-xs text-white/60">Regarding: Black Samsung Galaxy S24</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <button className="p-2 hover:bg-white/[0.02] rounded-lg transition-colors"><Phone className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-white/[0.02] rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/[0.02]">
            <div className="text-center text-xs text-white/50 my-4">Today</div>
            
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">A</div>
              <div>
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-3 rounded-2xl rounded-tl-sm border border-white/[0.12] text-sm text-white/80 shadow-sm">
                  Hi! I think I found your phone. Does it have a small scratch on the bottom left corner?
                </div>
                <div className="text-[10px] text-white/50 mt-1 ml-1">10:30 AM</div>
              </div>
            </div>

            <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">Me</div>
              <div>
                <div className="gradient-primary p-3 rounded-2xl rounded-tr-sm text-sm text-white shadow-md">
                  Omg yes! That's it! Thank you so much for reaching out. What kind of case is on it?
                </div>
                <div className="text-[10px] text-white/50 mt-1 mr-1 text-right">10:35 AM</div>
              </div>
            </div>

            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">A</div>
              <div>
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-3 rounded-2xl rounded-tl-sm border border-white/[0.12] text-sm text-white/80 shadow-sm">
                  Yes, it has a blue case.
                </div>
                <div className="text-[10px] text-white/50 mt-1 ml-1">10:42 AM</div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border-t border-white/[0.08]">
            <div className="flex items-end gap-2 bg-white/[0.02] rounded-2xl border border-white/[0.12] p-2 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
              <button className="p-2 text-white/50 hover:text-primary-500 transition-colors shrink-0">
                <ImageIcon className="w-5 h-5" />
              </button>
              <textarea 
                placeholder="Type a message..." 
                className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[40px] text-sm py-2.5 outline-none"
                rows={1}
              />
              <button className="p-2 w-10 h-10 rounded-xl gradient-primary text-white flex items-center justify-center shrink-0 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white/[0.02] flex-col gap-4">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-white/40" />
          </div>
          <p className="text-white/60 font-medium">Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
}
