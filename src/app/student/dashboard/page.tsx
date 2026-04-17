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
  LogOut,
  GraduationCap,
  Settings,
  Download,
  MessageSquare,
  BarChart3,
  ChevronRight,
  Play,
  AlertCircle,
  Star,
  MessageCircle,
  Lightbulb,
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

// "Did you know?" tips for the dashboard
const DID_YOU_KNOW_TIPS = [
  "You can change your password anytime from the Settings page.",
  "Take tests as soon as they appear — they may expire after a deadline!",
  "Check your Performance page regularly to track your progress over time.",
  "You can message your teacher directly from the Messages section.",
  "Review your past results to learn from your mistakes and improve.",
  "Your overall score updates automatically after every test you complete.",
  "Study notes uploaded by your teachers are available in the Study Notes section.",
  "Got feedback? Use the Feedback section to share your thoughts with teachers.",
  "The quicker you complete a test, the better your time score looks!",
  "You can view detailed answer breakdowns after your teacher releases results.",
]

// Map subject names to accent colors for visual distinction
const SUBJECT_ACCENT: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  science: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  math: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  mathematics: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  english: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", dot: "bg-violet-400" },
  hindi: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  computer: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", dot: "bg-indigo-400" },
  history: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
  geography: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", dot: "bg-teal-400" },
}

function getSubjectAccent(subject: string) {
  const key = subject.toLowerCase().trim()
  for (const [k, v] of Object.entries(SUBJECT_ACCENT)) {
    if (key.includes(k)) return v
  }
  return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", dot: "bg-slate-400" }
}

function getScoreColor(percentage: number) {
  if (percentage >= 80) return "text-emerald-400"
  if (percentage >= 60) return "text-amber-400"
  return "text-red-400"
}

function getScoreLabel(percentage: number) {
  if (percentage >= 90) return "Excellent"
  if (percentage >= 75) return "Good"
  if (percentage >= 60) return "Average"
  return "Needs Work"
}

export default function StudentDashboardPage() {
  const { data: session } = useSession()
  const [availableTests, setAvailableTests] = useState<Test[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [stats, setStats] = useState<Stats>({ totalTests: 0, avgPercentage: 0, lastAttemptDate: null })
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // "Did you know?" tip rotation
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * DID_YOU_KNOW_TIPS.length))
  const [tipVisible, setTipVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipVisible(false)
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % DID_YOU_KNOW_TIPS.length)
        setTipVisible(true)
      }, 400)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/student/dashboard")
      const data = await res.json()
      setAvailableTests(data.availableTests || [])
      setResults(data.results || [])
      setStats(data.stats || { totalTests: 0, avgPercentage: 0, lastAttemptDate: null })

      const unreadRes = await fetch("/api/messages/unread")
      if (unreadRes.ok) {
        const unreadData = await unreadRes.json()
        if (unreadData.unreadCount !== undefined) {
          setUnreadCount(unreadData.unreadCount)
        }
      }
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

  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "Student"

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="text-indigo-400 w-6 h-6 animate-pulse" />
            </div>
          </div>
          <p className="text-indigo-400/80 font-bold text-sm animate-pulse tracking-wide">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white selection:bg-indigo-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/8 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-sm tracking-tight leading-none">DPSMRN</span>
              <span className="text-slate-500 text-[9px] font-bold tracking-widest uppercase">Student Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Messages */}
            <Link
              href="/student/messages"
              className="relative flex items-center gap-1.5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all text-sm"
            >
              <MessageSquare size={16} />
              <span className="font-semibold text-xs hidden sm:inline">Messages</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0a0f1e] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Settings */}
            <Link
              href="/student/settings"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all text-sm"
            >
              <Settings size={16} />
              <span className="font-semibold text-xs hidden sm:inline">Settings</span>
            </Link>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/5 transition-all text-sm"
            >
              <LogOut size={16} />
              <span className="font-semibold text-xs hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">

        {/* ────────────────────────────────
            SECTION 1: Welcome Header
        ──────────────────────────────── */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 via-[#111827] to-teal-600/10 border border-white/5 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-medium">{greeting},</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                {firstName} 👋
              </h1>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                {availableTests.length > 0
                  ? `You have ${availableTests.length} test${availableTests.length > 1 ? "s" : ""} available. Stay focused and do your best!`
                  : "No tests right now. Check back soon or review your past performance."
                }
              </p>

              {/* 💡 Did You Know? Rotating Tips */}
              <div className="mt-3 flex items-start gap-2.5 bg-amber-500/[0.07] border border-amber-500/15 rounded-xl px-3.5 py-2.5 max-w-md">
                <div className="flex-shrink-0 w-5 h-5 bg-amber-500/20 rounded-md flex items-center justify-center mt-0.5">
                  <Lightbulb size={12} className="text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest mb-0.5">Did you know?</p>
                  <p
                    className={`text-xs text-slate-300 font-medium leading-relaxed transition-all duration-400 ${
                      tipVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                    }`}
                  >
                    {DID_YOU_KNOW_TIPS[tipIndex]}
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 text-center min-w-[130px] backdrop-blur-sm">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={stats.avgPercentage >= 80 ? "#34d399" : stats.avgPercentage >= 60 ? "#fbbf24" : "#f87171"}
                    strokeWidth="6"
                    strokeDasharray={`${(2 * Math.PI * 34 * stats.avgPercentage) / 100} ${2 * Math.PI * 34}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-extrabold ${getScoreColor(stats.avgPercentage)}`}>{stats.avgPercentage}%</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Overall Score</p>
            </div>
          </div>
        </header>

        {/* ────────────────────────────────
            SECTION 2: Quick Stats
        ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Tests Completed */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3 group hover:bg-white/[0.05] transition-all">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-white leading-none">{stats.totalTests}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Tests Done</p>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3 group hover:bg-white/[0.05] transition-all">
            <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 flex-shrink-0">
              <Trophy size={20} />
            </div>
            <div className="min-w-0">
              <p className={`text-2xl font-extrabold leading-none ${getScoreColor(stats.avgPercentage)}`}>{stats.avgPercentage}%</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Avg. Score</p>
            </div>
          </div>

          {/* Pending Tests */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3 group hover:bg-white/[0.05] transition-all">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
              <AlertCircle size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-white leading-none">{availableTests.length}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Pending</p>
            </div>
          </div>

          {/* Last Activity */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3 group hover:bg-white/[0.05] transition-all">
            <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 flex-shrink-0">
              <Calendar size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white leading-none truncate">
                {stats.lastAttemptDate ? formatDate(stats.lastAttemptDate) : "No activity"}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Last Test</p>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────
            SECTION 3: Available Tests
        ──────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-red-500 rounded-full" />
              <div>
                <h2 className="text-lg font-extrabold text-white leading-tight">Available Tests</h2>
                <p className="text-xs text-slate-500 font-medium">Tests assigned to you by your teachers</p>
              </div>
            </div>
            {availableTests.length > 0 && (
              <span className="text-xs text-slate-500 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {availableTests.length} {availableTests.length === 1 ? "test" : "tests"}
              </span>
            )}
          </div>

          {availableTests.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] py-16 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={28} className="text-slate-600" />
              </div>
              <h3 className="text-base font-bold text-slate-300 mb-1">All caught up!</h3>
              <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">
                No tests are available right now. New tests will appear here when assigned.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTests.map((test) => {
                const accent = getSubjectAccent(test.subject)
                return (
                  <div
                    key={test.id}
                    className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                  >
                    {/* Color accent bar */}
                    <div className={`h-1 ${accent.dot}`} />

                    <div className="p-5">
                      {/* Subject & Duration */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${accent.bg} ${accent.text} border ${accent.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                          {test.subject}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold">
                          <Clock size={12} />
                          {test.duration} min
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-[15px] font-bold text-white leading-snug mb-4 line-clamp-2 min-h-[2.5rem] group-hover:text-indigo-300 transition-colors">
                        {test.title}
                      </h3>

                      {/* Questions count and Start button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-semibold">
                            {test._count.questions} {test._count.questions === 1 ? "Question" : "Questions"}
                          </span>
                        </div>

                        <Link
                          href={`/student/test/${test.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95 transition-all"
                        >
                          <Play size={12} />
                          Start Test
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ────────────────────────────────
            SECTION 4: Recent Results
        ──────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-full" />
              <div>
                <h2 className="text-lg font-extrabold text-white leading-tight">Recent Results</h2>
                <p className="text-xs text-slate-500 font-medium">Your latest test scores and performance</p>
              </div>
            </div>
            {results.length > 3 && (
              <Link
                href="/student/performance"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
              >
                View All
                <ChevronRight size={14} />
              </Link>
            )}
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] py-12 text-center">
              <Trophy size={28} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-semibold">No results yet. Complete a test to see your scores here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {results.slice(0, 5).map((result) => {
                const percentage = Math.round((result.score / result.totalMarks) * 100)
                const accent = getSubjectAccent(result.test.subject)
                return (
                  <Link
                    key={result.id}
                    href={`/student/results/${result.id}`}
                    className="group flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 rounded-2xl p-4 transition-all"
                  >
                    {/* Score circle */}
                    <div className="flex-shrink-0 relative w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                        <circle
                          cx="24" cy="24" r="20" fill="none"
                          stroke={percentage >= 80 ? "#34d399" : percentage >= 60 ? "#fbbf24" : "#f87171"}
                          strokeWidth="4"
                          strokeDasharray={`${(2 * Math.PI * 20 * percentage) / 100} ${2 * Math.PI * 20}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-extrabold ${getScoreColor(percentage)}`}>
                        {percentage}%
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {result.test.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${accent.text}`}>
                          {result.test.subject}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(result.submittedAt)}
                        </span>
                        <span className="text-slate-600 hidden sm:inline">•</span>
                        <span className="text-[10px] text-slate-500 font-medium items-center gap-1 hidden sm:flex">
                          <Clock size={10} />
                          {formatTime(result.timeTaken)}
                        </span>
                      </div>
                    </div>

                    {/* Score label */}
                    <div className="flex-shrink-0 text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-400">{result.score}/{result.totalMarks}</p>
                      <p className={`text-[10px] font-bold ${getScoreColor(percentage)}`}>{getScoreLabel(percentage)}</p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ────────────────────────────────
            SECTION 5: Quick Access
        ──────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-full" />
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">Quick Access</h2>
              <p className="text-xs text-slate-500 font-medium">Shortcuts to explore more features</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Performance Analytics */}
            <Link
              href="/student/performance"
              className="group flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] hover:bg-indigo-500/5 hover:border-indigo-500/20 rounded-2xl p-4 transition-all"
            >
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all flex-shrink-0">
                <BarChart3 size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Performance</h3>
                <p className="text-[10px] text-slate-500 font-medium">Charts & analytics</p>
              </div>
              <ChevronRight size={14} className="text-slate-600 ml-auto flex-shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Study Materials */}
            <Link
              href="/student/notes"
              className="group flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] hover:bg-amber-500/5 hover:border-amber-500/20 rounded-2xl p-4 transition-all"
            >
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all flex-shrink-0">
                <Download size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Study Notes</h3>
                <p className="text-[10px] text-slate-500 font-medium">PDFs & materials</p>
              </div>
              <ChevronRight size={14} className="text-slate-600 ml-auto flex-shrink-0 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Messages */}
            <Link
              href="/student/messages"
              className="group flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] hover:bg-teal-500/5 hover:border-teal-500/20 rounded-2xl p-4 transition-all"
            >
              <div className="relative w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all flex-shrink-0">
                <MessageCircle size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#0a0f1e]">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">Messages</h3>
                <p className="text-[10px] text-slate-500 font-medium">Chat with teachers</p>
              </div>
              <ChevronRight size={14} className="text-slate-600 ml-auto flex-shrink-0 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Feedback */}
            <Link
              href="/student/feedback"
              className="group flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] hover:bg-violet-500/5 hover:border-violet-500/20 rounded-2xl p-4 transition-all"
            >
              <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all flex-shrink-0">
                <Star size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">Feedback</h3>
                <p className="text-[10px] text-slate-500 font-medium">Share your thoughts</p>
              </div>
              <ChevronRight size={14} className="text-slate-600 ml-auto flex-shrink-0 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center">
        <p className="text-[10px] text-slate-600 font-semibold">
          Developed by Manoj Upadhyay (Computer Teacher) &bull; &copy; 2026 DPSMRN Mathura
        </p>
      </footer>
    </div>
  )
}
