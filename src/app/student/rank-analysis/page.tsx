"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  Trophy,
  Medal,
  Crown,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  BookOpen,
  Sparkles,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  GraduationCap,
  Flame,
  Star,
  Zap,
} from "lucide-react"

// ─── Types ───

interface TestAnalysis {
  testId: string
  title: string
  subject: string
  date: string
  totalMarks: number
  studentScore: number
  studentPercentage: number
  sectionRank: number
  sectionTotal: number
  sectionTopperScore: number
  sectionTopperName: string
  sectionAverage: number
  classRank: number
  classTotal: number
  classTopperScore: number
  classTopperName: string
  classAverage: number
  status: "topper" | "above_avg" | "average" | "below_avg" | "needs_work"
}

interface OverallStats {
  studentAvgPercentage: number
  sectionRank: number
  sectionTotal: number
  sectionTopperAvg: number
  sectionTopperName: string
  sectionAverage: number
  classRank: number
  classTotal: number
  classTopperAvg: number
  classTopperName: string
  classAverage: number
}

interface Recommendation {
  title: string
  subject: string
  studentPct: number
  classPct?: number
  gap?: number
  rank?: number
}

interface RankData {
  tests: TestAnalysis[]
  overall: OverallStats | null
  recommendations: {
    needsRevision: Recommendation[]
    strongChapters: Recommendation[]
  }
  studentInfo: { name: string; class: string; section: string }
}

// ─── Subject Colors ───

const SUBJECT_ACCENT: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  science: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  math: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  mathematics: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  english: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", dot: "bg-violet-400" },
  hindi: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  computer: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", dot: "bg-indigo-400" },
  history: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
  geography: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", dot: "bg-teal-400" },
  sst: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400" },
  "social science": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400" },
}

function getSubjectAccent(subject: string) {
  const key = subject.toLowerCase().trim()
  for (const [k, v] of Object.entries(SUBJECT_ACCENT)) {
    if (key.includes(k)) return v
  }
  return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", dot: "bg-slate-400" }
}

function getStatusConfig(status: TestAnalysis["status"]) {
  switch (status) {
    case "topper":
      return { label: "🏆 Class Topper", bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-400", icon: Crown }
    case "above_avg":
      return { label: "Above Average", bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", icon: TrendingUp }
    case "average":
      return { label: "Average", bg: "bg-blue-500/10", border: "border-blue-500/25", text: "text-blue-400", icon: Minus }
    case "below_avg":
      return { label: "Below Average", bg: "bg-orange-500/10", border: "border-orange-500/25", text: "text-orange-400", icon: TrendingDown }
    case "needs_work":
      return { label: "Needs Revision", bg: "bg-red-500/10", border: "border-red-500/25", text: "text-red-400", icon: AlertTriangle }
  }
}

function getScoreColor(pct: number) {
  if (pct >= 80) return "text-emerald-400"
  if (pct >= 60) return "text-amber-400"
  return "text-red-400"
}

function getRankBadgeColor(rank: number, total: number) {
  const percentile = ((total - rank) / total) * 100
  if (rank === 1) return "from-amber-400 to-yellow-500"
  if (rank <= 3) return "from-indigo-400 to-violet-500"
  if (percentile >= 75) return "from-emerald-400 to-teal-500"
  if (percentile >= 50) return "from-blue-400 to-cyan-500"
  return "from-slate-400 to-slate-500"
}

export default function RankAnalysisPage() {
  const [data, setData] = useState<RankData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scope, setScope] = useState<"section" | "class">("section")

  useEffect(() => {
    fetch("/api/student/rank-analysis")
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="text-amber-400 w-6 h-6 animate-pulse" />
            </div>
          </div>
          <p className="text-amber-400/80 font-bold text-sm animate-pulse tracking-wide">
            Computing your rankings...
          </p>
        </div>
      </div>
    )
  }

  if (!data.overall || data.tests.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase tracking-widest transition-colors mb-8"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 size={36} className="text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-300 mb-2">No Test Data Yet</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Complete at least one test to see your rank analysis and chapter-wise performance breakdown.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { overall, tests, recommendations, studentInfo } = data

  const rank = scope === "section" ? overall.sectionRank : overall.classRank
  const totalStudents = scope === "section" ? overall.sectionTotal : overall.classTotal
  const topperAvg = scope === "section" ? overall.sectionTopperAvg : overall.classTopperAvg
  const topperName = scope === "section" ? overall.sectionTopperName : overall.classTopperName
  const classOrSectionAvg = scope === "section" ? overall.sectionAverage : overall.classAverage
  const scopeLabel = scope === "section" ? `${studentInfo.class}-${studentInfo.section}` : `Class ${studentInfo.class}`

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white selection:bg-indigo-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-amber-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/8 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-teal-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/student/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-sm tracking-tight leading-none">Rank Analysis</span>
              <span className="text-slate-500 text-[9px] font-bold tracking-widest uppercase">Chapter Wise</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">

        {/* ──────────────── SCOPE TOGGLE ──────────────── */}
        <div className="flex items-center justify-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl max-w-xs mx-auto">
          <button
            onClick={() => setScope("section")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              scope === "section"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users size={14} />
            My Section
          </button>
          <button
            onClick={() => setScope("class")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              scope === "class"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <GraduationCap size={14} />
            All Sections
          </button>
        </div>

        {/* ──────────────── OVERALL RANK HERO ──────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600/15 via-[#111827] to-indigo-600/10 border border-white/5 p-6 sm:p-8">
          {/* Shimmer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-amber-400/5 to-transparent animate-[shimmer_4s_infinite] skew-x-12" />
          </div>
          <div className="absolute top-3 right-4 text-amber-500/15 animate-pulse"><Sparkles size={24} /></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
            {/* Rank Badge */}
            <div className="flex-shrink-0 relative">
              <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${getRankBadgeColor(rank, totalStudents)} flex items-center justify-center shadow-2xl relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block mb-1">Rank</span>
                  <span className="text-4xl sm:text-5xl font-black text-white leading-none drop-shadow-lg">
                    #{rank}
                  </span>
                </div>
              </div>
              {rank <= 3 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-[#0a0f1e] shadow-lg animate-bounce">
                  {rank === 1 ? <Crown size={16} className="text-white" /> : <Medal size={16} className="text-white" />}
                </div>
              )}
            </div>

            {/* Rank Details */}
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Overall Position in {scopeLabel}</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  Rank #{rank} <span className="text-slate-500 text-lg font-bold">/ {totalStudents}</span>
                </h1>
              </div>

              {/* Mini Stats Row */}
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                {/* Your Average */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Your Avg</p>
                  <p className={`text-lg font-extrabold ${getScoreColor(overall.studentAvgPercentage)}`}>
                    {overall.studentAvgPercentage}%
                  </p>
                </div>
                {/* Class/Section Average */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{scope === "section" ? "Sec" : "Class"} Avg</p>
                  <p className="text-lg font-extrabold text-slate-300">
                    {classOrSectionAvg}%
                  </p>
                </div>
                {/* Topper */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Topper</p>
                  <p className="text-lg font-extrabold text-amber-400">
                    {topperAvg}%
                  </p>
                  <p className="text-[9px] text-slate-600 font-medium truncate max-w-[90px]">{topperName}</p>
                </div>
              </div>

              {/* Gap from topper */}
              {rank > 1 && (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Flame size={14} className="text-orange-400" />
                  <span className="text-xs text-slate-400 font-medium">
                    <span className="text-orange-400 font-bold">{(topperAvg - overall.studentAvgPercentage).toFixed(1)}%</span> gap from topper
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ──────────────── CHAPTER-WISE ANALYSIS ──────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-full" />
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">Chapter-wise Performance</h2>
              <p className="text-xs text-slate-500 font-medium">
                Detailed test-by-test comparison against topper and average — in {scopeLabel}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {tests.map((test) => {
              const accent = getSubjectAccent(test.subject)
              const statusConfig = getStatusConfig(test.status)
              const StatusIcon = statusConfig.icon

              const myPct = test.studentPercentage
              const topperScore = scope === "section" ? test.sectionTopperScore : test.classTopperScore
              const topperName = scope === "section" ? test.sectionTopperName : test.classTopperName
              const avg = scope === "section" ? test.sectionAverage : test.classAverage
              const avgPct = test.totalMarks > 0 ? (avg / test.totalMarks) * 100 : 0
              const topperPct = test.totalMarks > 0 ? (topperScore / test.totalMarks) * 100 : 0
              const testRank = scope === "section" ? test.sectionRank : test.classRank
              const testTotal = scope === "section" ? test.sectionTotal : test.classTotal

              return (
                <div
                  key={test.testId}
                  className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                >
                  {/* Top accent bar */}
                  <div className={`h-0.5 ${accent.dot}`} />

                  <div className="p-5 space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${accent.bg} ${accent.text} border ${accent.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                            {test.subject}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium">{formatDate(test.date)}</span>
                        </div>
                        <h3 className="text-[15px] font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors">
                          {test.title}
                        </h3>
                      </div>

                      {/* Rank + Status */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </div>
                        <div className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-center">
                          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Rank</p>
                          <p className="text-sm font-extrabold text-white">#{testRank}<span className="text-slate-600 text-[10px] font-bold">/{testTotal}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Score Comparison Bars */}
                    <div className="space-y-2.5">
                      {/* Your Score */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16 text-right flex-shrink-0">You</span>
                        <div className="flex-1 h-6 bg-white/[0.04] rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full rounded-lg transition-all duration-700 ${
                              myPct >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                              myPct >= 60 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                              "bg-gradient-to-r from-red-500 to-red-400"
                            }`}
                            style={{ width: `${Math.max(myPct, 2)}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-white">
                            {test.studentScore}/{test.totalMarks} ({myPct}%)
                          </span>
                        </div>
                      </div>

                      {/* Average */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16 text-right flex-shrink-0">Avg</span>
                        <div className="flex-1 h-6 bg-white/[0.04] rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-slate-500/50 to-slate-400/50 transition-all duration-700"
                            style={{ width: `${Math.max(avgPct, 2)}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400">
                            {avg.toFixed(1)}/{test.totalMarks} ({avgPct.toFixed(0)}%)
                          </span>
                        </div>
                      </div>

                      {/* Topper */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16 text-right flex-shrink-0">Topper</span>
                        <div className="flex-1 h-6 bg-white/[0.04] rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-amber-500/40 to-amber-400/40 transition-all duration-700"
                            style={{ width: `${Math.max(topperPct, 2)}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-amber-400">
                            {topperScore}/{test.totalMarks} ({topperPct.toFixed(0)}%) — {topperName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Summary */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {myPct > avgPct ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <ArrowUp size={11} /> {(myPct - avgPct).toFixed(1)}% above average
                        </span>
                      ) : myPct < avgPct ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400">
                          <ArrowDown size={11} /> {(avgPct - myPct).toFixed(1)}% below average
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400">
                          <Minus size={11} /> Exactly at average
                        </span>
                      )}
                      {topperPct > myPct && (
                        <span className="text-[10px] text-slate-600">•</span>
                      )}
                      {topperPct > myPct && (
                        <span className="text-[10px] font-medium text-slate-500">
                          {(topperPct - myPct).toFixed(1)}% gap to topper
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ──────────────── RECOMMENDATIONS ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Needs Revision */}
          <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Needs Revision</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Chapters where you scored below average</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {recommendations.needsRevision.length === 0 ? (
                <div className="py-6 text-center">
                  <Star size={24} className="text-emerald-500/40 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Great job! No chapters need revision.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recommendations.needsRevision.map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/[0.04] border border-red-500/10 hover:bg-red-500/[0.08] transition-all">
                      <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 text-xs font-extrabold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{ch.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-red-400">{ch.studentPct}%</span>
                          <span className="text-[10px] text-slate-600">vs avg</span>
                          <span className="text-[10px] font-bold text-slate-400">{ch.classPct}%</span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] font-bold text-red-400/70">-{ch.gap}% gap</span>
                        </div>
                      </div>
                      <BookOpen size={14} className="text-red-400/40 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Strong Chapters */}
          <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Strong Chapters</h3>
                  <p className="text-[10px] text-slate-500 font-medium">You&apos;re excelling in these areas</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {recommendations.strongChapters.length === 0 ? (
                <div className="py-6 text-center">
                  <Target size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Keep working hard — your strong chapters will show up here!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recommendations.strongChapters.map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 hover:bg-emerald-500/[0.08] transition-all">
                      <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-extrabold flex-shrink-0">
                        {ch.rank === 1 ? <Crown size={14} /> : `#${ch.rank}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{ch.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-emerald-400">{ch.studentPct}%</span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] font-medium text-slate-500">Rank #{ch.rank} in class</span>
                        </div>
                      </div>
                      <Trophy size={14} className="text-emerald-400/40 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ──────────────── FOOTER ──────────────── */}
        <div className="flex flex-col items-center pt-4 space-y-4">
          <Link
            href="/student/dashboard"
            className="group flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] hover:bg-indigo-500/10 hover:border-indigo-500/20 px-6 py-3 rounded-2xl transition-all"
          >
            <ChevronLeft size={16} className="text-slate-500 group-hover:text-indigo-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-300">
              Back to Dashboard
            </span>
          </Link>
          <p className="text-[10px] text-slate-600 font-semibold">
            Developed by Manoj Upadhyay (Computer Teacher) &bull; &copy; 2026 DPSMRN Mathura
          </p>
        </div>

      </main>
    </div>
  )
}
