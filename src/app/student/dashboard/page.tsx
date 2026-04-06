"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ExternalLink,
  LogOut,
  BrainCircuit,
  Settings
} from "lucide-react"

interface Test {
  id: string
  title: string
  subject: string
  duration: number
  _count: { questions: number }
}

interface Result {
  id: string
  score: number
  totalMarks: number
  submittedAt: string
  timeTaken: number
  test: { title: string; subject: string }
}

interface Stats {
  totalTests: number
  avgPercentage: number
  lastAttemptDate: string | null
}

export default function StudentDashboardPage() {
  const { data: session } = useSession()
  const [availableTests, setAvailableTests] = useState<Test[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [stats, setStats] = useState<Stats>({ totalTests: 0, avgPercentage: 0, lastAttemptDate: null })
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await fetch("/api/student/dashboard")
      const data = await res.json()
      setAvailableTests(data.availableTests || [])
      setResults(data.results || [])
      setStats(data.stats || { totalTests: 0, avgPercentage: 0, lastAttemptDate: null })
    } catch {
      console.error("Failed to fetch dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Preparing your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 -z-10 bg-[#f8fafc]">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-teal-50 to-indigo-50 opacity-60"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-200/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-slate-200/50 transition-all">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <BrainCircuit size={18} className="text-teal-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-black text-sm tracking-tight leading-none uppercase">DPSMRN</span>
              <span className="text-slate-400 text-[9px] font-bold tracking-widest uppercase">Mathura Portal</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Link
              href="/student/settings"
              className="flex items-center space-x-1.5 text-slate-500 hover:text-teal-600 transition-all duration-300 py-1.5 px-3 rounded-lg hover:bg-teal-50 border border-transparent hover:border-teal-100 text-sm"
            >
              <Settings size={15} />
              <span className="font-bold text-xs tracking-tight hidden md:inline">Settings</span>
            </Link>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center space-x-1.5 text-slate-500 hover:text-red-500 transition-all duration-300 py-1.5 px-3 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 text-sm"
            >
              <LogOut size={15} />
              <span className="font-bold text-xs tracking-tight hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 pt-20 pb-12">
        {/* Hero Greeting */}
        <div className="relative mb-8 p-6 rounded-2xl overflow-hidden group">
          <div className="absolute inset-0 premium-gradient opacity-90"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-white/90 text-[10px] font-bold uppercase tracking-wider mb-3">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>
                <span>Active Learning Session</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 text-balance">
                Welcome, {session?.user?.name ? session.user.name.split(' ')[0] : 'Student'}!
              </h1>
              <p className="text-teal-50/70 text-sm font-medium leading-relaxed max-w-lg">
                Explore available tests, monitor your performance, and master your subjects with real-time feedback.
              </p>
            </div>
            
            <div className="flex items-center">
              <div className="glass p-4 rounded-2xl min-w-[140px] border-white/30">
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Current Standing</p>
                <div className="flex items-end space-x-1">
                  <span className="text-3xl font-black text-slate-900 leading-none">{stats.avgPercentage}%</span>
                  <span className="text-teal-600 font-bold text-xs bg-teal-50 px-1.5 py-0.5 rounded-md mb-0.5">Overall</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass p-4 rounded-2xl flex items-center space-x-4 group hover:scale-[1.02] transition-all cursor-default">
            <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 flex-shrink-0">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Average Mastery</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight text-gradient">{stats.avgPercentage}%</h3>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl flex items-center space-x-4 group hover:scale-[1.02] transition-all cursor-default">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Tests Completed</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{stats.totalTests}</h3>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl flex items-center space-x-4 group hover:scale-[1.02] transition-all cursor-default">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 flex-shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Recent Activity</p>
              <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">
                {stats.lastAttemptDate ? formatDate(stats.lastAttemptDate) : "Nothing Yet"}
              </h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Tests Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-3">
                  <span className="w-6 h-0.5 bg-teal-600 rounded-full inline-block"></span>
                  <span>Active Assessments</span>
                </h2>
                <p className="text-slate-400 font-bold text-[10px] mt-0.5 ml-9 uppercase tracking-widest">Curated for your progress</p>
              </div>
              <span className="text-slate-400 font-bold text-xs">
                Showing {availableTests.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTests.length === 0 ? (
                <div className="col-span-2 py-14 text-center glass rounded-2xl border-dashed border-2 border-slate-200 shadow-none">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <BookOpen size={28} />
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-1">You&apos;re all caught up!</h3>
                  <p className="text-slate-400 text-sm font-medium">New assessments will appear here as they are assigned.</p>
                </div>
              ) : (
                availableTests.map((test) => (
                  <div key={test.id} className="group bg-white rounded-2xl p-1 shadow-lg shadow-slate-200/50 hover:scale-[1.01] transition-all duration-500 overflow-hidden border border-slate-100/50">
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${test.subject.toLowerCase().includes('comp') ? 'bg-indigo-500' : 'bg-teal-500'}`}></span>
                          <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                            {test.subject}
                          </span>
                        </div>
                        <div className="bg-slate-50 px-2.5 py-1 rounded-lg flex items-center text-slate-400 font-bold text-[10px]">
                          <Clock size={11} className="mr-1 text-slate-300" />
                          {test.duration}m
                        </div>
                      </div>

                      <h3 className="text-base font-black text-slate-900 mb-4 leading-tight line-clamp-2 min-h-[2.8rem]">
                        {test.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                           <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 text-[10px] font-bold">
                             {test._count.questions}
                           </div>
                           <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Questions</div>
                        </div>
                        
                        <Link 
                          href={`/student/test/${test.id}`}
                          className="premium-gradient p-2.5 rounded-xl text-white shadow-lg shadow-teal-600/20 hover:shadow-indigo-600/30 hover:scale-110 transition-all active:scale-95"
                        >
                          <ExternalLink size={16} strokeWidth={2.5} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-3">
              <span className="w-6 h-0.5 bg-indigo-600 rounded-full inline-block"></span>
              <span>Past Records</span>
            </h2>

            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="p-8 text-center glass rounded-2xl">
                  <p className="text-slate-400 text-sm font-bold italic">No history recorded yet.</p>
                </div>
              ) : (
                results.slice(0, 5).map((result) => (
                  <div key={result.id} className="glass p-4 rounded-2xl hover:translate-x-1 transition-all duration-300 border-transparent hover:border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="max-w-[70%]">
                        <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{result.test.title}</h4>
                        <div className="flex items-center mt-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{result.test.subject}</span>
                        </div>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <svg className="w-10 h-10 -rotate-90">
                           <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                           <circle cx="20" cy="20" r="16" fill="none" stroke="#0d9488" strokeWidth="3" 
                             strokeDasharray={100} 
                             strokeDashoffset={100 - (100 * (result.score / result.totalMarks))}
                             strokeLinecap="round"
                           />
                        </svg>
                        <span className="absolute text-[9px] font-black">{Math.round((result.score / result.totalMarks) * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                      <div className="flex items-center text-slate-400 text-[9px] font-bold space-x-2 uppercase tracking-tighter">
                        <span className="flex items-center bg-slate-50 px-1.5 py-0.5 rounded-md">
                           <Calendar size={10} className="mr-1 opacity-40" /> {formatDate(result.submittedAt)}
                        </span>
                        <span className="flex items-center bg-slate-50 px-1.5 py-0.5 rounded-md">
                           <Clock size={10} className="mr-1 opacity-40" /> {formatTime(result.timeTaken)}
                        </span>
                      </div>
                      <Link 
                        href={`/student/results/${result.id}`}
                        className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                         <Trophy size={13} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {results.length > 5 && (
              <Link 
                href="/student/performance" 
                className="group flex flex-col items-center justify-center space-y-1.5 p-5 glass rounded-2xl hover:bg-white transition-all"
              >
                <span className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em]">Examine All Records</span>
                <div className="flex items-center space-x-2 text-slate-900 font-black text-sm group-hover:text-teal-600">
                   <span>Performance History</span>
                   <ExternalLink size={14} />
                </div>
              </Link>
            )}
          </div>
        </div>
      </main>
      <footer className="max-w-6xl mx-auto px-5 pb-8 text-center">
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-0.5">
          Developed by Manoj Upadhyay (Computer Teacher)
        </p>
        <p className="text-[9px] text-slate-300 font-medium">
          &copy; 2026 DPSMRN Mathura. All rights reserved.
        </p>
      </footer>
    </div>
  )
}


