"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { 
  Send, 
  MessageSquare,
  Loader2,
  CheckCheck,
  Check,
  Search,
  Megaphone,
  X,
  ChevronDown,
  ArrowLeft,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  ShieldAlert
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
  type: string // "NORMAL" | "WARNING"
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

type DeleteMode = "all" | "thread" | "selected" | null

const CLASS_OPTIONS = ["VI", "VII", "VIII", "IX", "X", "XI", "XII"]
const SECTION_OPTIONS = ["A", "B", "C", "D", "E"]

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
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({
    class: "",
    sections: [] as string[],
    content: ""
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Delete feature state ---
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteMode>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningText, setWarningText] = useState("")
  const [isSendingWarning, setIsSendingWarning] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const buildThreads = useCallback((students: Student[], messages: (Message & { studentId: string })[]) => {
    const threadMap = new Map<string, Thread>()
    students.forEach((s: Student) => {
      threadMap.set(s.admno, { 
        id: s.admno, 
        name: s.name, 
        classStr: `${s.class}-${s.section}`, 
        unreadCount: 0 
      })
    })
    messages.forEach((m) => {
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
    return Array.from(threadMap.values()).sort((a, b) => {
      if (!a.lastMessageTime) return 1
      if (!b.lastMessageTime) return -1
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    })
  }, [])

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch("/api/admin/messages")
        const data = await res.json()
        if (data.students) setStudents(data.students)
        if (data.messages && data.students) {
          setThreads(buildThreads(data.students, data.messages))
        }
      } catch (error) {
        console.error("Failed to fetch messages", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialData()
  }, [buildThreads])

  // Load chat
  useEffect(() => {
    if (!selectedStudent) return
    // Reset selection when switching chats
    setSelectionMode(false)
    setSelectedMessageIds(new Set())

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
    if (!selectedStudent || !newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: selectedStudent.admno, 
          content: newMessage.trim() 
        })
      })
      
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setNewMessage("")
        setThreads(prev => prev.map(t => 
          t.id === selectedStudent.admno 
            ? { ...t, lastMessage: msg.content, lastMessageTime: msg.createdAt } 
            : t
        ))
        setTimeout(scrollToBottom, 50)
      } else {
        toast.error("Failed to send message")
      }
    } catch {
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleSendWarning = async () => {
    if (!selectedStudent || !warningText.trim() || isSendingWarning) return
    setIsSendingWarning(true)
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.admno,
          content: warningText.trim(),
          type: "WARNING"
        })
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setWarningText("")
        setShowWarningModal(false)
        setThreads(prev => prev.map(t =>
          t.id === selectedStudent.admno
            ? { ...t, lastMessage: msg.content, lastMessageTime: msg.createdAt }
            : t
        ))
        setTimeout(scrollToBottom, 50)
        toast.success("⚠️ Warning sent to student")
      } else {
        toast.error("Failed to send warning")
      }
    } catch {
      toast.error("Failed to send warning")
    } finally {
      setIsSendingWarning(false)
    }
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastForm.class || broadcastForm.sections.length === 0 || !broadcastForm.content.trim() || isBroadcasting) {
      toast.error("Please fill all fields and select at least one section")
      return
    }

    setIsBroadcasting(true)
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "broadcast",
          class: broadcastForm.class,
          sections: broadcastForm.sections,
          content: broadcastForm.content.trim()
        })
      })
      
      if (res.ok) {
        toast.success("Broadcast message sent successfully!")
        setBroadcastForm({ class: "", sections: [], content: "" })
        setShowBroadcastModal(false)
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to send broadcast")
      }
    } catch {
      toast.error("Failed to send broadcast")
    } finally {
      setIsBroadcasting(false)
    }
  }

  // ---- Delete handlers ----
  const toggleMessageSelection = (id: string) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedMessageIds.size === messages.length) {
      setSelectedMessageIds(new Set())
    } else {
      setSelectedMessageIds(new Set(messages.map(m => m.id)))
    }
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    setIsDeleting(true)
    try {
      let body: Record<string, unknown> = {}

      if (deleteConfirm === "all") {
        body = { deleteAll: true }
      } else if (deleteConfirm === "thread" && selectedStudent) {
        body = { studentId: selectedStudent.admno }
      } else if (deleteConfirm === "selected") {
        body = { messageIds: Array.from(selectedMessageIds) }
      }

      const res = await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (res.ok) {
        const deletedCount = data.deleted as number

        if (deleteConfirm === "all") {
          setThreads(prev => prev.map(t => ({ ...t, lastMessage: undefined, lastMessageTime: undefined, unreadCount: 0 })))
          setMessages([])
          setSelectedStudent(null)
          toast.success(`Deleted all ${deletedCount} messages`)
        } else if (deleteConfirm === "thread") {
          setMessages([])
          setThreads(prev => prev.map(t => 
            t.id === selectedStudent?.admno 
              ? { ...t, lastMessage: undefined, lastMessageTime: undefined, unreadCount: 0 }
              : t
          ))
          toast.success(`Deleted ${deletedCount} messages in this chat`)
        } else if (deleteConfirm === "selected") {
          const deletedIds = new Set(selectedMessageIds)
          setMessages(prev => prev.filter(m => !deletedIds.has(m.id)))
          setSelectedMessageIds(new Set())
          setSelectionMode(false)
          // Update thread preview if last message was deleted
          toast.success(`Deleted ${deletedCount} selected message${deletedCount !== 1 ? "s" : ""}`)
        }

        setDeleteConfirm(null)
      } else {
        toast.error(data.error || "Delete failed")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleBroadcastSection = (sec: string) => {
    setBroadcastForm(prev => ({
      ...prev,
      sections: prev.sections.includes(sec)
        ? prev.sections.filter(s => s !== sec)
        : [...prev.sections, sec]
    }))
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata'
    })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }
    if (d.toLocaleDateString("en-IN", options) === today.toLocaleDateString("en-IN", options)) {
      return d.toLocaleTimeString("en-IN", { hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata' })
    }
    return d.toLocaleDateString("en-IN", { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })
  }

  const filteredThreads = threads.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.classStr.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allSelected = messages.length > 0 && selectedMessageIds.size === messages.length

  return (
    <div className="space-y-4 pb-4 h-[calc(100vh-2rem)] flex flex-col">
      <header className="flex flex-col flex-none md:flex-row justify-between items-start md:items-center gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
          <p className="text-slate-400 text-sm font-medium">Communicate with students</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Delete All Messages */}
          <button
            onClick={() => setDeleteConfirm("all")}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-sm"
          >
            <Trash2 size={15} />
            <span>Delete All</span>
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Megaphone size={18} />
            <span>Section Broadcast</span>
          </button>
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
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100/50 bg-white/50 backdrop-blur-md flex items-center gap-3 z-10 box-border">
                <button 
                  onClick={() => { setSelectedStudent(null); setSelectionMode(false); setSelectedMessageIds(new Set()) }} 
                  className="lg:hidden p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                >
                  <ArrowLeft size={16} />
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

                {/* Chat-level action buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  {selectionMode ? (
                    <>
                      {/* Select All toggle */}
                      <button
                        onClick={handleSelectAll}
                        title={allSelected ? "Deselect all" : "Select all"}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                      >
                        {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                        All
                      </button>
                      {selectedMessageIds.size > 0 && (
                        <button
                          onClick={() => setDeleteConfirm("selected")}
                          className="flex items-center gap-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg shadow-md shadow-red-600/20 transition-all active:scale-95"
                        >
                          <Trash2 size={13} />
                          Delete ({selectedMessageIds.size})
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectionMode(false); setSelectedMessageIds(new Set()) }}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                        title="Cancel selection"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* ⚠️ Warning Button */}
                      <button
                        onClick={() => setShowWarningModal(true)}
                        title="Send a warning to this student"
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all border border-amber-200 hover:border-amber-300 shadow-sm"
                      >
                        <ShieldAlert size={14} />
                        Warn
                      </button>
                      <button
                        onClick={() => setSelectionMode(true)}
                        title="Select messages"
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                      >
                        <CheckSquare size={14} />
                        Select
                      </button>
                      {messages.length > 0 && (
                        <button
                          onClick={() => setDeleteConfirm("thread")}
                          title="Delete this conversation"
                          className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-200"
                        >
                          <Trash2 size={14} />
                          Clear Chat
                        </button>
                      )}
                    </>
                  )}
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
                      const isMe = msg.senderRole !== "STUDENT"
                      const isWarning = msg.type === "WARNING"
                      const showAvatar = i === messages.length - 1 || messages[i + 1]?.senderRole !== msg.senderRole
                      const isSelected = selectedMessageIds.has(msg.id)

                      // Render WARNING messages as a full-width system banner
                      if (isWarning) {
                        return (
                          <div
                            key={msg.id}
                            className={`flex justify-center my-2 ${selectionMode ? "cursor-pointer" : ""}`}
                            onClick={() => { if (selectionMode) toggleMessageSelection(msg.id) }}
                          >
                            <div className={`w-full max-w-md rounded-2xl border-2 overflow-hidden shadow-lg transition-all ${
                              isSelected ? "border-red-400 ring-2 ring-red-300 ring-offset-1" : "border-amber-300"
                            }`}>
                              <div className="bg-gradient-to-r from-amber-500 to-red-500 px-4 py-2 flex items-center gap-2">
                                <ShieldAlert size={16} className="text-white flex-shrink-0" />
                                <span className="text-white font-black text-xs uppercase tracking-widest">Official Warning</span>
                                {selectionMode && (
                                  <div className={`ml-auto w-4 h-4 rounded flex items-center justify-center ${
                                    isSelected ? "bg-white text-red-500" : "bg-white/30 text-white"
                                  }`}>
                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                  </div>
                                )}
                              </div>
                              <div className="bg-amber-50 px-4 py-3">
                                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{msg.content}</p>
                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-2">{formatTime(msg.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"} ${selectionMode ? "cursor-pointer" : ""}`}
                          onClick={() => { if (selectionMode) toggleMessageSelection(msg.id) }}
                        >
                          {/* Selection checkbox on the left for "my" messages, right for student */}
                          {selectionMode && isMe && (
                            <div className={`self-center w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? "bg-red-500 text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300"
                            }`}>
                              {isSelected ? <Check size={12} strokeWidth={3} /> : <span className="w-3 h-3 rounded-sm border border-current" />}
                            </div>
                          )}

                          {!isMe && showAvatar && (
                            <div className="w-6 h-6 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mt-auto flex-shrink-0 text-[10px] font-black">
                               {selectedStudent.name.charAt(0)}
                            </div>
                          )}
                          {!isMe && !showAvatar && <div className="w-6 hidden" />}
                          
                          <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap transition-all ${
                              isMe 
                              ? `bg-indigo-600 text-white rounded-br-sm shadow-indigo-600/20 ${selectionMode && isSelected ? "ring-2 ring-red-400 ring-offset-2 opacity-80" : ""}` 
                              : `bg-white text-slate-800 border border-slate-100 rounded-bl-sm ${selectionMode && isSelected ? "ring-2 ring-red-400 ring-offset-2 opacity-80" : ""}`
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

                          {/* Selection checkbox on the right for student messages */}
                          {selectionMode && !isMe && (
                            <div className={`self-center w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? "bg-red-500 text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300"
                            }`}>
                              {isSelected ? <Check size={12} strokeWidth={3} /> : <span className="w-3 h-3 rounded-sm border border-current" />}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-3 bg-white/80 backdrop-blur-md border-t border-slate-100">
                {selectionMode ? (
                  <div className="flex items-center justify-center h-[46px] text-sm font-bold text-slate-400 gap-2">
                    <CheckSquare size={15} className="text-indigo-400" />
                    {selectedMessageIds.size === 0
                      ? "Tap messages to select them"
                      : `${selectedMessageIds.size} message${selectedMessageIds.size !== 1 ? "s" : ""} selected`}
                  </div>
                ) : (
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
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex-col items-center justify-center text-slate-400 hidden lg:flex">
                <MessageSquare size={64} className="text-slate-200 mb-6" />
                <h3 className="text-lg font-black text-slate-900 mb-2">Student Communication</h3>
                <p className="text-sm font-medium max-w-xs text-center text-slate-500">
                  Select a student from the sidebar to view messages or start a new conversation.
                </p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Megaphone size={20} />
                  </div>
                  Section Broadcast
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Send to entire classes/sections</p>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleBroadcast} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Class Select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Target Class *</label>
                  <div className="relative">
                    <select
                      required
                      value={broadcastForm.class}
                      onChange={e => setBroadcastForm({ ...broadcastForm, class: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold appearance-none transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800"
                    >
                      <option value="">Select a class</option>
                      {CLASS_OPTIONS.map(c => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Sections Multi-Select */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Visible to Sections *</label>
                  <div className="flex flex-wrap gap-2">
                    {SECTION_OPTIONS.map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleBroadcastSection(sec)}
                        className={`px-5 py-2 rounded-xl text-sm font-black border transition-all ${
                          broadcastForm.sections.includes(sec)
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                            : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                        }`}
                      >
                        Section {sec}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold italic ml-1">Choose at least one section</p>
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Your Message *</label>
                  <textarea
                    required
                    value={broadcastForm.content}
                    onChange={e => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                    rows={4}
                    placeholder="Type your announcement to the class..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isBroadcasting || !broadcastForm.class || broadcastForm.sections.length === 0 || !broadcastForm.content.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95"
                >
                  {isBroadcasting ? (
                    <><Loader2 size={20} className="animate-spin" /> Broadcasting...</>
                  ) : (
                    <><Send size={18} /> Send Section Broadcast</>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                  Messages will appear in individual student chats
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Warning header */}
            <div className="px-8 pt-8 pb-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">
                {deleteConfirm === "all" && "Delete All Messages?"}
                {deleteConfirm === "thread" && "Clear This Chat?"}
                {deleteConfirm === "selected" && `Delete ${selectedMessageIds.size} Message${selectedMessageIds.size !== 1 ? "s" : ""}?`}
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {deleteConfirm === "all" && "This will permanently delete every message across all student conversations. This action cannot be undone."}
                {deleteConfirm === "thread" && `This will permanently delete all messages in your conversation with ${selectedStudent?.name}. This cannot be undone.`}
                {deleteConfirm === "selected" && "The selected messages will be permanently deleted. This action cannot be undone."}
              </p>
            </div>

            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-black hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-600/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting
                  ? <><Loader2 size={16} className="animate-spin" /> Deleting...</>
                  : <><Trash2 size={16} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && selectedStudent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-red-500 px-8 py-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={26} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg leading-tight">Send Warning</h2>
                <p className="text-white/80 text-xs font-bold mt-0.5">To: {selectedStudent.name} ({selectedStudent.admno})</p>
              </div>
              <button
                onClick={() => { setShowWarningModal(false); setWarningText("") }}
                className="ml-auto p-2 hover:bg-white/20 text-white rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  This warning will appear prominently in the student&apos;s chat as an <strong>Official Warning</strong> banner. Use this for serious misconduct only.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Warning Message *</label>
                <textarea
                  autoFocus
                  value={warningText}
                  onChange={e => setWarningText(e.target.value)}
                  rows={4}
                  placeholder="Describe the misbehavior and consequences clearly..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 text-slate-800 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowWarningModal(false); setWarningText("") }}
                  disabled={isSendingWarning}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-black hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWarning}
                  disabled={isSendingWarning || !warningText.trim()}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-black shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSendingWarning
                    ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    : <><ShieldAlert size={16} /> Send Warning</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
