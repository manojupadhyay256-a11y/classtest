"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { 
  ArrowLeft, 
  Send, 
  User, 
  MessageSquare,
  Loader2,
  CheckCheck,
  Check
} from "lucide-react"
import { toast } from "react-hot-toast"

interface Teacher {
  id: string
  name: string
  email: string
}

interface Message {
  id: string
  content: string
  senderRole: string
  createdAt: string
  isRead: boolean
}

interface Thread {
  id: string
  name: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export default function StudentMessagesPage() {
  const { data: session } = useSession()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch("/api/student/messages")
        const data = await res.json()
        if (data.teachers) setTeachers(data.teachers)
        
        // Compute threads dynamically from allMessages
        if (data.messages && data.teachers) {
          const threadMap = new Map<string, Thread>()
          
          data.teachers.forEach((t: Teacher) => {
             threadMap.set(t.id, { id: t.id, name: t.name, unreadCount: 0 })
          })

          data.messages.forEach((m: Message & { teacherId: string }) => {
            const tId = m.teacherId
            if (threadMap.has(tId)) {
              const thread = threadMap.get(tId)!
              if (!thread.lastMessageTime || new Date(m.createdAt) > new Date(thread.lastMessageTime)) {
                thread.lastMessage = m.content
                thread.lastMessageTime = m.createdAt
              }
              if (m.senderRole === "TEACHER" && !m.isRead) {
                thread.unreadCount++
              }
            }
          })
          
          setThreads(Array.from(threadMap.values()).sort((a,b) => {
            if (!a.lastMessageTime) return 1
            if (!b.lastMessageTime) return -1
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
          }))
        }
      } catch (error) {
        console.error("Failed to fetch messages", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchInitialData()
    // Mark global unread as zero could be handled by layout, but skipping here
  }, [])

  // Load chat
  useEffect(() => {
    if (!selectedTeacher) return

    const fetchChat = async () => {
      setIsChatLoading(true)
      try {
        const res = await fetch(`/api/student/messages?teacherId=${selectedTeacher.id}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setMessages(data)
        }
        
        // Mark as read
        await fetch("/api/messages/read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: session?.user?.email, teacherId: selectedTeacher.id })
        })
        
        // Clear unread count locally
        setThreads(prev => prev.map(t => t.id === selectedTeacher.id ? { ...t, unreadCount: 0 } : t))
        
      } catch (error) {
        console.error("Failed to load chat", error)
      } finally {
        setIsChatLoading(false)
        setTimeout(scrollToBottom, 50)
      }
    }
    
    fetchChat()
    
    // Auto-refresh chat every 10 seconds
    const interval = setInterval(fetchChat, 10000)
    return () => clearInterval(interval)
  }, [selectedTeacher, session?.user?.email])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedTeacher || isSending) return

    setIsSending(true)
    try {
      const res = await fetch("/api/student/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTeacher.id, content: newMessage.trim() })
      })
      
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setNewMessage("")
        setTimeout(scrollToBottom, 50)
        
        // Update thread
        setThreads(prev => {
          const idx = prev.findIndex(t => t.id === selectedTeacher.id)
          if (idx === -1) return prev
          const copy = [...prev]
          copy[idx] = { ...copy[idx], lastMessage: msg.content, lastMessageTime: msg.createdAt }
          return copy.sort((a,b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
        })
      }
    } catch {
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata'
    })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    // Compare in IST
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' };
    if (d.toLocaleDateString("en-IN", options) === today.toLocaleDateString("en-IN", options)) {
      return d.toLocaleTimeString("en-IN", { hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata' })
    }
    return d.toLocaleDateString("en-IN", { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#f8fafc]">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-50 to-teal-50 opacity-60" />
      </div>

      {/* Nav */}
      <nav className="w-full z-50 bg-white/60 backdrop-blur-2xl border-b border-slate-200/50 flex-none h-14">
        <div className="h-full flex items-center px-4 max-w-6xl mx-auto">
          <Link href="/student/dashboard" className="flex items-center text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors mr-3">
             <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <MessageSquare size={16} className="text-teal-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-black text-sm tracking-tight leading-none uppercase">Messages</span>
              <span className="text-slate-400 text-[9px] font-bold tracking-widest uppercase">Contact Teachers</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Chat Layout */}
      <main className="flex-1 flex max-w-6xl mx-auto w-full h-[calc(100vh-3.5rem)] overflow-hidden pb-4 pt-4 px-4 gap-4">
        
        {/* Sidebar / Thread list */}
        <div className={`${selectedTeacher ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col glass rounded-3xl border border-white/40 shadow-xl overflow-hidden`}>
          <div className="p-4 border-b border-slate-100/50 premium-gradient text-white">
            <h3 className="font-black text-sm uppercase tracking-wider">Conversations</h3>
            <p className="text-[10px] text-white/70 font-medium">Select a teacher to chat</p>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar p-2 space-y-1">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : threads.length === 0 ? (
              <div className="p-4 text-center text-sm font-medium text-slate-400">No teachers found.</div>
            ) : (
              threads.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeacher(teachers.find(th => th.id === t.id) || null)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    selectedTeacher?.id === t.id 
                    ? "bg-white shadow-md shadow-slate-200/50 border border-slate-200/60" 
                    : "hover:bg-white/50 border border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0 font-bold border border-indigo-200/50 shadow-sm relative">
                    <User size={18} />
                    {t.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-white text-[9px] flex items-center justify-center font-black">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-black text-sm text-slate-900 truncate">{t.name}</h4>
                      {t.lastMessageTime && <span className="text-[9px] font-bold text-slate-400">{formatDate(t.lastMessageTime)}</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate font-medium">
                      {t.lastMessage || "Click to start chatting"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!selectedTeacher ? 'hidden' : 'flex'} w-full flex-col glass rounded-3xl border border-white/40 shadow-xl overflow-hidden relative`}>
          {selectedTeacher ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100/50 bg-white/50 backdrop-blur-md flex items-center gap-3 space-between z-10">
                <button onClick={() => setSelectedTeacher(null)} className="md:hidden p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <ArrowLeft size={16} />
                </button>
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <User size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-sm text-slate-900">{selectedTeacher.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Teacher</p>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {isChatLoading && messages.length === 0 ? (
                   <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare size={48} className="text-slate-200 mb-4" />
                    <p className="font-bold text-sm">No messages yet.</p>
                    <p className="text-xs">Say hello to start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const isMe = msg.senderRole === "STUDENT"
                      const showAvatar = i === messages.length - 1 || messages[i + 1]?.senderRole !== msg.senderRole
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                          {!isMe && showAvatar && (
                            <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mt-auto flex-shrink-0">
                               <User size={12} />
                            </div>
                          )}
                          {!isMe && !showAvatar && <div className="w-6 hidden" />}
                          
                          <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                              isMe 
                              ? "bg-teal-500 text-white rounded-br-sm" 
                              : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                            }`}>
                              {msg.content}
                            </div>
                            <div className="flex items-center gap-1 mt-1 px-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {formatTime(msg.createdAt)}
                              </span>
                              {isMe && (
                                msg.isRead 
                                  ? <CheckCheck size={10} className="text-teal-500" />
                                  : <Check size={10} className="text-slate-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white/80 backdrop-blur-md border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-700 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="w-12 h-[46px] bg-slate-900 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-900/10 hover:bg-teal-500 hover:shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
          <div className="h-full flex-col items-center justify-center text-slate-400 hidden md:flex">
                <MessageSquare size={64} className="text-slate-200 mb-6" />
                <h3 className="text-lg font-black text-slate-900 mb-2">Your Messages</h3>
                <p className="text-sm font-medium max-w-xs text-center text-slate-500">
                  Select a conversation from the sidebar to view messages or start a new chat.
                </p>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
