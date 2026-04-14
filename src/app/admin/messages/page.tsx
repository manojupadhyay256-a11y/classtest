"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { 
  Send, 
  User, 
  MessageSquare,
  Loader2,
  CheckCheck,
  Check,
  Search
} from "lucide-react"
import { toast } from "react-hot-toast"

interface Student {
  admno: string
  name: string
  class: string
  section: string
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
  classStr: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export default function AdminMessagesPage() {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
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
        const res = await fetch("/api/admin/messages")
        const data = await res.json()
        if (data.students) setStudents(data.students)
        
        if (data.messages && data.students) {
          const threadMap = new Map<string, Thread>()
          
          data.students.forEach((s: Student) => {
             threadMap.set(s.admno, { 
                id: s.admno, 
                name: s.name, 
                classStr: `${s.class}-${s.section}`, 
                unreadCount: 0 
             })
          })

          data.messages.forEach((m: Message & { studentId: string }) => {
            const sId = m.studentId
            if (threadMap.has(sId)) {
              const thread = threadMap.get(sId)!
              if (!thread.lastMessageTime || new Date(m.createdAt) > new Date(thread.lastMessageTime)) {
                thread.lastMessage = m.content
                thread.lastMessageTime = m.createdAt
              }
              if (m.senderRole === "STUDENT" && !m.isRead) {
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
  }, [])

  // Load chat
  useEffect(() => {
    if (!selectedStudent) return

    const fetchChat = async () => {
      setIsChatLoading(true)
      try {
        const res = await fetch(`/api/admin/messages?studentId=${selectedStudent.admno}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setMessages(data)
        }
        
        // Mark as read
        await fetch("/api/messages/read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: selectedStudent.admno, teacherId: session?.user?.id })
        })
        
        setThreads(prev => prev.map(t => t.id === selectedStudent.admno ? { ...t, unreadCount: 0 } : t))
        
      } catch (error) {
        console.error("Failed to load chat", error)
      } finally {
        setIsChatLoading(false)
        setTimeout(scrollToBottom, 50)
      }
    }
    
    fetchChat()
    const interval = setInterval(fetchChat, 10000)
    return () => clearInterval(interval)
  }, [selectedStudent, session?.user?.id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedStudent || isSending) return

    setIsSending(true)
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent.admno, content: newMessage.trim() })
      })
      
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setNewMessage("")
        setTimeout(scrollToBottom, 50)
        
        setThreads(prev => {
          const idx = prev.findIndex(t => t.id === selectedStudent.admno)
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
      hour: '2-digit', minute:'2-digit'
    })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString("en-IN", { hour: '2-digit', minute:'2-digit' })
    }
    return d.toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })
  }

  const filteredThreads = threads.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.classStr.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4 pb-4 h-[calc(100vh-2rem)] flex flex-col">
      <header className="flex flex-col flex-none md:flex-row justify-between items-start md:items-center gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
          <p className="text-slate-400 text-sm font-medium">Communicate with students</p>
        </div>
      </header>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Sidebar */}
        <div className={`${selectedStudent ? 'hidden lg:flex' : 'flex'} w-full lg:w-[350px] flex-col glass rounded-2xl border border-white/40 shadow-xl overflow-hidden`}>
          <div className="p-4 border-b border-slate-100/50 bg-white/50 backdrop-blur-md">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar p-2 space-y-1">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-center text-sm font-medium text-slate-400">No students found.</div>
            ) : (
              // Show threads with messages first, then the rest
              [...filteredThreads.filter(t => t.lastMessageTime), ...filteredThreads.filter(t => !t.lastMessageTime)].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedStudent(students.find(s => s.admno === t.id) || null)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    selectedStudent?.admno === t.id 
                    ? "bg-white shadow-md shadow-slate-200/50 border border-slate-200/60" 
                    : "hover:bg-white/50 border border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl flex items-center justify-center text-teal-600 flex-shrink-0 font-bold border border-teal-200/50 shadow-sm relative">
                    {t.name.charAt(0)}
                    {t.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-white text-[9px] flex items-center justify-center font-black shadow-sm">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-black text-sm text-slate-900 truncate">{t.name}</h4>
                      {t.lastMessageTime && <span className="text-[9px] font-bold text-slate-400">{formatDate(t.lastMessageTime)}</span>}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <p className="text-slate-500 truncate font-medium flex-1 mr-2">
                        {t.lastMessage || "No messages yet"}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{t.classStr}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!selectedStudent ? 'hidden' : 'flex'} flex-1 flex-col glass rounded-2xl border border-white/40 shadow-xl overflow-hidden relative`}>
          {selectedStudent ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100/50 bg-white/50 backdrop-blur-md flex items-center gap-3 z-10 box-border">
                <button 
                  onClick={() => setSelectedStudent(null)} 
                  className="lg:hidden p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                >
                  <User size={16} /> {/* Placeholder for back button since ArrowLeft might need to be imported */}
                </button>
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                  <span className="font-black">{selectedStudent.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-sm text-slate-900">{selectedStudent.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Student</p>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedStudent.admno} &bull; {selectedStudent.class}-{selectedStudent.section}</p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {isChatLoading && messages.length === 0 ? (
                   <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare size={48} className="text-slate-200 mb-4" />
                    <p className="font-bold text-sm text-slate-600">No messages yet.</p>
                    <p className="text-xs">Send a message to start communicating with {selectedStudent.name.split(' ')[0]}.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const isMe = msg.senderRole !== "STUDENT" // Teacher or Admin
                      const showAvatar = i === messages.length - 1 || messages[i + 1]?.senderRole !== msg.senderRole
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                          {!isMe && showAvatar && (
                            <div className="w-6 h-6 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mt-auto flex-shrink-0 text-[10px] font-black">
                               {selectedStudent.name.charAt(0)}
                            </div>
                          )}
                          {!isMe && !showAvatar && <div className="w-6 hidden" />}
                          
                          <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${
                              isMe 
                              ? "bg-indigo-600 text-white rounded-br-sm shadow-indigo-600/20" 
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
                                  ? <CheckCheck size={10} className="text-indigo-500" />
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

              {/* Input */}
              <div className="p-3 bg-white/80 backdrop-blur-md border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message to the student..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="w-12 h-[46px] bg-indigo-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 hidden lg:flex">
                <MessageSquare size={64} className="text-slate-200 mb-6" />
                <h3 className="text-lg font-black text-slate-900 mb-2">Student Communication</h3>
                <p className="text-sm font-medium max-w-xs text-center text-slate-500">
                  Select a student from the sidebar to view messages or start a new conversation.
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
