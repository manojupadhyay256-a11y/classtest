"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import {
  BookOpen, Download, FileText, Search,
  BrainCircuit, Settings, LogOut, User,
  ArrowLeft, Loader2
} from "lucide-react"

interface Note {
  id: string
  title: string
  subject: string
  chapter: string
  class: string
  sections: string[]
  fileName: string
  fileUrl: string
  instructions: string | null
  createdAt: string
  teacher: {
    name: string
    email: string
  }
}

const SUBJECT_COLORS: Record<string, string> = {
  science: "from-teal-500 to-emerald-500",
  math: "from-blue-500 to-indigo-500",
  mathematics: "from-blue-500 to-indigo-500",
  english: "from-purple-500 to-violet-500",
  hindi: "from-orange-500 to-amber-500",
  history: "from-rose-500 to-pink-500",
  geography: "from-green-500 to-teal-500",
  computer: "from-indigo-500 to-blue-500",
}

function getSubjectGradient(subject: string): string {
  const key = subject.toLowerCase().trim()
  for (const [k, v] of Object.entries(SUBJECT_COLORS)) {
    if (key.includes(k)) return v
  }
  return "from-slate-600 to-slate-700"
}

export default function StudentNotesPage() {
  const { data: session } = useSession()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/student/notes")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotes(data) })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const getEmailPrefix = (email: string) => email.split("@")[0]

  const filtered = notes.filter(n =>
    [n.title, n.subject, n.chapter].join(" ").toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce((acc, note) => {
    const key = note.subject
    if (!acc[key]) acc[key] = []
    acc[key].push(note)
    return acc
  }, {} as Record<string, Note[]>)

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#f8fafc]">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-amber-50 to-orange-50 opacity-60" />
        <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-amber-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-orange-200/20 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="fixed w-full top-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/student/dashboard" className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                <BrainCircuit size={18} className="text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-900 font-black text-sm tracking-tight leading-none uppercase">DPSMRN</span>
                <span className="text-slate-400 text-[9px] font-bold tracking-widest uppercase">Study Materials</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Link
              href="/student/settings"
              className="flex items-center space-x-1.5 text-slate-500 hover:text-teal-600 transition-all py-1.5 px-3 rounded-lg hover:bg-teal-50 text-sm"
            >
              <Settings size={15} />
              <span className="font-bold text-xs hidden md:inline">Settings</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center space-x-1.5 text-slate-500 hover:text-red-500 transition-all py-1.5 px-3 rounded-lg hover:bg-red-50 text-sm"
            >
              <LogOut size={15} />
              <span className="font-bold text-xs hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 pt-20 pb-16">
        {/* Hero */}
        <div className="relative mb-8 p-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-90" />
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-white/90 text-[10px] font-bold uppercase tracking-wider mb-3">
              <BookOpen size={11} />
              <span>Study Materials</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Chapter Notes</h1>
            <p className="text-amber-50/70 text-sm font-medium">
              Download notes shared by your teachers for Class {session?.user?.name ? "" : ""}
              {notes.length > 0 ? `${notes[0].class}` : "your class"}.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes by title, subject, or chapter..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 text-sm outline-none transition-all shadow-sm"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-slate-400 text-sm font-medium">Loading study materials...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center rounded-2xl bg-white border-2 border-dashed border-slate-200">
            <BookOpen size={40} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-black text-slate-900 mb-1">No notes available</h3>
            <p className="text-slate-400 text-sm font-medium">
              Your teachers haven&apos;t uploaded any notes yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([subject, subjectNotes]) => (
              <section key={subject}>
                {/* Subject header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getSubjectGradient(subject)} flex items-center justify-center text-white`}>
                    <BookOpen size={15} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">{subject}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {subjectNotes.length} {subjectNotes.length === 1 ? "note" : "notes"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectNotes.map(note => (
                    <div
                      key={note.id}
                      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {/* Top accent */}
                      <div className={`h-1.5 bg-gradient-to-r ${getSubjectGradient(note.subject)}`} />

                      <div className="p-5">
                        {/* Chapter badge */}
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                          {note.chapter}
                        </span>

                        <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-amber-600 transition-colors">
                          {note.title}
                        </h3>

                        {/* Instructions callout */}
                        {note.instructions && (
                          <div className="mb-4 px-3.5 py-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">📋 Teacher’s Instructions</p>
                            <p className="text-xs text-amber-900 leading-relaxed">{note.instructions}</p>
                          </div>
                        )}

                        {/* Uploader credit */}
                        <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl mb-4">
                          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            {/* We show Shield for ADMIN role is not available here, fallback to User */}
                            <User size={12} className="text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 leading-none truncate">
                              {note.teacher.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                              ID: @{getEmailPrefix(note.teacher.email)}
                            </p>
                          </div>
                          <span className="ml-auto flex-shrink-0 text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 font-black rounded-md uppercase tracking-wide">
                            Teacher
                          </span>
                        </div>

                        {/* File name */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-4 truncate">
                          <FileText size={11} className="flex-shrink-0" />
                          <span className="truncate font-medium">{note.fileName}</span>
                        </div>

                        {/* Date + Download */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {new Date(note.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata"
                            })}
                          </span>
                          <a
                            href={note.fileUrl}
                            target="_blank"
                            download={note.fileName}
                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white rounded-xl bg-gradient-to-r ${getSubjectGradient(note.subject)} shadow-md hover:shadow-lg active:scale-95 transition-all`}
                          >
                            <Download size={13} />
                            {note.fileName.match(/\.html?$/i) ? 'View HTML' : 'Download PDF'}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
