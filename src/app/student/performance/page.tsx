"use client"

import { useEffect, useState } from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from "recharts"
import Link from "next/link"
import { 
  Layout, 
  ChevronLeft, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  BookOpen, 
  CheckCircle2,
  BrainCircuit,
  ExternalLink
} from "lucide-react"

const COLORS = ["#0d9488", "#0891b2", "#0284c7", "#2563eb", "#4f46e5", "#7c3aed"]

interface PerformanceData {
  lineData: { date: string; percentage: number }[]
  barData: { subject: string; average: number }[]
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/student/performance")
      .then(res => res.json())
      .then(d => {
        setData(d)
        setIsLoading(false)
      })
  }, [])

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="text-indigo-500 w-6 h-6 animate-pulse" />
            </div>
          </div>
          <p className="text-indigo-500/80 font-black uppercase tracking-[0.2em] text-sm animate-pulse">Processing Cognitive Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="bg-mesh opacity-20 absolute inset-0"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-12 space-y-10">
        <header className="bg-slate-900/80 backdrop-blur-xl shadow-2xl p-8 md:p-12 rounded-[2.5rem] border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <BarChart3 size={160} className="text-white" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div className="space-y-4">
              <Link 
                href="/student/dashboard" 
                className="inline-flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase tracking-widest transition-colors mb-2"
              >
                <ChevronLeft size={16} />
                <span>Return to Dashboard</span>
              </Link>
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                  Academic Analytics
                </h1>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    Performance V3.0
                  </span>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-500" /> Live Data Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="bg-slate-900/80 backdrop-blur-xl shadow-2xl bg-white/5 px-6 py-4 rounded-3xl border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Global Status</p>
                  <p className="text-xl font-black text-white tracking-tight">Active Pulse</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trend Chart */}
          <div className="bg-slate-900/80 backdrop-blur-xl shadow-2xl p-8 md:p-10 rounded-[2.5rem] border-white/10 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Performance Velocity</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Score progression over time (%)</p>
              </div>
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Sparkles size={18} />
              </div>
            </div>
            
            <div className="h-80 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.lineData}>
                  <defs>
                    <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: "#64748b", textAnchor: 'middle' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: "#64748b" }} 
                    domain={[0, 100]} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15, 23, 42, 0.9)", 
                      borderRadius: "16px", 
                      border: "1px solid rgba(255, 255, 255, 0.1)", 
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                      backdropFilter: "blur(12px)",
                      padding: "12px",
                      fontSize: "12px",
                      fontWeight: "900",
                      color: "#fff"
                    }}
                    cursor={{ stroke: "#6366f1", strokeWidth: 2, strokeDasharray: '4 4' }}
                    itemStyle={{ color: "#818cf8", fontSize: "14px" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#818cf8" 
                    strokeWidth={5} 
                    dot={{ r: 6, fill: "#818cf8", strokeWidth: 3, stroke: "#1e293b" }} 
                    activeDot={{ r: 9, fill: "#fff", strokeWidth: 4, stroke: "#818cf8" }}
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Bar Chart */}
          <div className="bg-slate-900/80 backdrop-blur-xl shadow-2xl p-8 md:p-10 rounded-[2.5rem] border-white/10 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Subject Domain Mastery</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Average proficiency level per subject (%)</p>
              </div>
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
                <Target size={18} />
              </div>
            </div>
            
            <div className="h-80 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis 
                    dataKey="subject" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: "#64748b" }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: "#64748b" }} 
                    domain={[0, 100]} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)", radius: 12 }}
                    contentStyle={{ 
                      backgroundColor: "rgba(15, 23, 42, 0.9)", 
                      borderRadius: "16px", 
                      border: "1px solid rgba(255, 255, 255, 0.1)", 
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                      backdropFilter: "blur(12px)",
                      padding: "12px",
                      fontSize: "12px",
                      fontWeight: "900",
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="average" radius={[12, 12, 4, 4]} barSize={40}>
                    {data.barData.map((_, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        className="transition-all duration-700 hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Motivational Section */}
        <section className="bg-slate-900/80 backdrop-blur-xl shadow-2xl p-12 rounded-[3.5rem] border-white/10 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
            <div className="relative inline-block">
               <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-700">
                 <Zap size={40} strokeWidth={2.5} />
               </div>
               <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white border-2 border-[#1e293b] animate-bounce">
                 <Sparkles size={14} />
               </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight uppercase">
                Optimizing for Excellence
              </h2>
              <p className="text-slate-400 font-medium text-base leading-relaxed">
                Your consistent data points reveal a high learning trajectory. Each assessment is an opportunity to tune your knowledge vectors and achieve 100% terminal proficiency. Keep iterating!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <div className="flex items-center space-x-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
                <CheckCircle2 size={16} />
                <span>Consistency Optimized</span>
              </div>
              <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
              <div className="flex items-center space-x-2 text-teal-400 font-black text-xs uppercase tracking-widest">
                <Layout size={16} />
                <span>Domain Mastery Rising</span>
              </div>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
           <div className="text-center md:text-left space-y-1">
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">System Evaluation Engine</p>
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Developed by DPSMRN Mathura • Computer Science Dept.</p>
           </div>
           
           <Link 
            href="/student/dashboard" 
            className="group flex items-center space-x-4 bg-white/5 hover:bg-slate-900 border border-white/10 px-8 py-4 rounded-3xl transition-all duration-500 shadow-xl"
          >
            <BookOpen size={18} className="text-indigo-400" />
            <span className="font-black text-sm uppercase tracking-widest text-slate-300">Control Hub</span>
            <ExternalLink size={14} className="text-slate-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
