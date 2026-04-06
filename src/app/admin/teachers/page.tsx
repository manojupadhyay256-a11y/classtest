"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import Card from "@/components/ui/card"
import { UserPlus, Mail, Shield, User, Trash2, Key, FileText } from "lucide-react"

interface Teacher {
  id: string
  name: string
  email: string
  role: string
  _count: { tests: number }
}

export default function TeachersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    password: "",
    role: "TEACHER"
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/admin/dashboard")
    } else if (status === "authenticated") {
      fetchTeachers()
    }
  }, [status, session, router])

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers")
      if (res.ok) {
        const data = await res.json()
        setTeachers(data)
      } else {
        toast.error("Failed to fetch teachers")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        body: JSON.stringify(newTeacher),
        headers: { "Content-Type": "application/json" }
      })
      if (res.ok) {
        toast.success("Teacher created successfully!")
        setNewTeacher({ name: "", email: "", password: "", role: "TEACHER" })
        setShowAddForm(false)
        fetchTeachers()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to create teacher")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Teacher deleted successfully")
        fetchTeachers()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete teacher")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-plus-jakarta text-slate-900">Teacher Management</h1>
          <p className="text-slate-500 mt-1">Create and manage staff accounts and roles.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
        >
          <UserPlus size={18} />
          <span>{showAddForm ? "Cancel" : "Add Teacher"}</span>
        </button>
      </header>

      {showAddForm && (
        <Card title="Register New Teacher" className="bg-white border-2 border-amber-100 shadow-xl shadow-amber-900/5 transition-all">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                  placeholder="teacher@school.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Access Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={newTeacher.role}
                  onChange={(e) => setNewTeacher({ ...newTeacher, role: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none"
                >
                  <option value="TEACHER">Standard Teacher (Tests Only)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
              >
                {isLoading ? "Processing..." : "Create Teacher Account"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${teacher.role === 'ADMIN' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                <User size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                teacher.role === 'ADMIN' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {teacher.role}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors uppercase truncate">
              {teacher.name}
            </h3>
            <p className="text-slate-500 text-sm flex items-center mt-1">
              <Mail size={12} className="mr-1.5" />
              {teacher.email}
            </p>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center">
                <FileText size={12} className="mr-1.5" />
                {teacher._count.tests} Tests Created
              </span>
              {teacher.email !== session?.user?.email && (
                <button 
                  onClick={() => handleDelete(teacher.id, teacher.name)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1" 
                  title="Delete Teacher"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
