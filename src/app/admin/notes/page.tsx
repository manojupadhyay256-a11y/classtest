"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  BookOpen, Upload, Trash2, Download, FileText,
  ChevronDown, X, Plus, Loader2, Search, Shield, User
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
    id: string
    name: string
    email: string
    role: string
  }
}

const CLASS_OPTIONS = ["VI", "VII", "VIII", "IX", "X", "XI", "XII"]
const SECTION_OPTIONS = ["A", "B", "C", "D", "E"]

export default function NotesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [form, setForm] = useState({
    title: "",
    subject: "",
    chapter: "",
    class: "",
    sections: [] as string[],
    instructions: "",
    file: null as File | null,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "ADMIN" &&
      session?.user?.role !== "TEACHER"
    ) {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchNotes()
    }
  }, [status, session, router])

  const fetchNotes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/notes")
      if (res.ok) setNotes(await res.json())
      else toast.error("Failed to load notes")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (sec: string) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.includes(sec)
        ? prev.sections.filter(s => s !== sec)
        : [...prev.sections, sec]
    }))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.file) { toast.error("Please select a PDF or HTML file"); return }
    if (form.sections.length === 0) { toast.error("Select at least one section"); return }

    setIsUploading(true)
    const fd = new FormData()
    fd.append("title", form.title)
    fd.append("subject", form.subject)
    fd.append("chapter", form.chapter)
    fd.append("class", form.class)
    fd.append("sections", JSON.stringify(form.sections))
    if (form.instructions.trim()) fd.append("instructions", form.instructions.trim())
    fd.append("file", form.file)

    try {
      const res = await fetch("/api/notes", { method: "POST", body: fd })
      if (res.ok) {
        toast.success("Note uploaded successfully!")
        setForm({ title: "", subject: "", chapter: "", class: "", sections: [], instructions: "", file: null })
        if (fileRef.current) fileRef.current.value = ""
        setShowForm(false)
        fetchNotes()
      } else {
        const err = await res.json()
        toast.error(err.details || err.error || "Upload failed")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (note: Note) => {
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Note deleted")
        fetchNotes()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete")
      }
    } catch {
      toast.error("Failed to delete note")
    }
  }

  const isAdmin = session?.user?.role === "ADMIN"

  const filtered = notes.filter(n =>
    [n.title, n.subject, n.chapter, n.class, n.teacher.name]
      .join(" ").toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  const getEmailPrefix = (email: string) => email.split("@")[0]

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-slate-400 text-sm font-medium">Loading notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-500" />
            Notes & Study Materials
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Upload chapter PDFs or HTML files — students will see and download them instantly.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? "Cancel" : "Upload File"}
        </button>
      </header>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-amber-100 shadow-xl shadow-amber-900/5 overflow-hidden">
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Upload size={16} className="text-amber-600" />
              Upload New Note
            </h2>
          </div>
          <form onSubmit={handleUpload} className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Note Title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm transition-all outline-none"
                placeholder="e.g. Chapter 3 - Motion Notes"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Subject *</label>
              <input
                required
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm transition-all outline-none"
                placeholder="e.g. Science"
              />
            </div>

            {/* Chapter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Chapter *</label>
              <input
                required
                type="text"
                value={form.chapter}
                onChange={e => setForm({ ...form, chapter: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm transition-all outline-none"
                placeholder="e.g. Chapter 3"
              />
            </div>

            {/* Class */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Class *</label>
              <div className="relative">
                <select
                  required
                  value={form.class}
                  onChange={e => setForm({ ...form, class: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm transition-all outline-none appearance-none"
                >
                  <option value="">Select a class</option>
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Visible to Sections * (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {SECTION_OPTIONS.map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleSection(sec)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                      form.sections.includes(sec)
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    Section {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                Instructions for Students
                <span className="text-[10px] text-slate-400 normal-case font-medium tracking-normal">(optional)</span>
              </label>
              <textarea
                value={form.instructions}
                onChange={e => setForm({ ...form, instructions: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm transition-all outline-none resize-none text-slate-800 placeholder:text-slate-400"
                placeholder="e.g. Read pages 45–60 before the test. Solve all practice questions at the end of the chapter."
              />
              <p className="text-[11px] text-slate-500 font-medium">Students will see this message when they open the note on their dashboard.</p>
            </div>

            {/* File */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">PDF / HTML File * (max 10MB)</label>
              <div
                className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-amber-400 transition-colors cursor-pointer group"
                onClick={() => fileRef.current?.click()}
              >
                <FileText size={28} className="mx-auto mb-2 text-slate-300 group-hover:text-amber-400 transition-colors" />
                {form.file ? (
                  <p className="text-sm font-bold text-amber-600">{form.file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-500">Click to select a PDF or HTML file</p>
                    <p className="text-xs text-slate-400 mt-0.5">.pdf and .html formats are accepted</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,application/pdf,.html,.htm,text/html"
                  className="hidden"
                  onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <><Loader2 size={17} className="animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={17} /> Upload Note</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by title, subject, chapter, teacher..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 text-sm outline-none transition-all"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <span>{filtered.length} {filtered.length === 1 ? "note" : "notes"} found</span>
        {!isAdmin && <span className="text-amber-500">· showing your uploads only</span>}
      </div>

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center glass rounded-2xl border-dashed border-2 border-slate-200">
          <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-black text-slate-900 mb-1">No notes yet</h3>
          <p className="text-slate-400 text-sm">Upload your first PDF to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(note => (
            <div
              key={note.id}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Color bar */}
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />

              <div className="p-5 flex-1 flex flex-col">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {note.class}
                  </span>
                  {note.sections.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                      §{s}
                    </span>
                  ))}
                </div>

                <h3 className="font-black text-slate-900 text-base leading-tight mb-1 line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {note.title}
                </h3>

                <p className="text-sm text-slate-500 font-medium mb-1">
                  <span className="font-bold text-slate-700">{note.subject}</span>
                  {" · "}{note.chapter}
                </p>

                {/* Instructions preview */}
                {note.instructions && (
                  <div className="mt-2 mb-3 px-3 py-2.5 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-0.5">Instructions</p>
                    <p className="text-xs text-amber-800 leading-relaxed line-clamp-3">{note.instructions}</p>
                  </div>
                )}

                {/* Uploader credit */}
                <div className="mt-auto pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
                        note.teacher.role === "ADMIN"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {note.teacher.role === "ADMIN"
                          ? <Shield size={12} />
                          : <User size={12} />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-none">{note.teacher.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          @{getEmailPrefix(note.teacher.email)}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {new Date(note.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata"
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
                  <FileText size={11} />
                  <span className="truncate">{note.fileName}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    {...(note.fileName.match(/\.html?$/i) ? {} : { download: note.fileName })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                  >
                    <Download size={12} />
                    {note.fileName.match(/\.html?$/i) ? 'HTML' : 'PDF'}
                  </a>
                  {(isAdmin || note.teacher.id === session?.user?.id) && (
                    <button
                      onClick={() => handleDelete(note)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
