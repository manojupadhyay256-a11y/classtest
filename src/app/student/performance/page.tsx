"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts"
import Card from "@/components/ui/card"
import Link from "next/link"

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

  if (isLoading || !data) return <div className="p-10 text-center font-bold text-teal-600">Analysing your performance...</div>

  return (
    <div className="min-h-screen bg-teal-50/20 p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex justify-between items-center bg-white p-10 rounded-3xl shadow-xl shadow-teal-700/5">
           <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">Your Learning Journey</h1>
              <p className="text-teal-600 font-bold uppercase tracking-widest text-sm">Visual Performance Dashboard</p>
           </div>
           <Link href="/student/dashboard" className="text-teal-700 font-bold hover:underline py-2 px-4 border-2 border-teal-200 rounded-xl hover:bg-teal-50 transition-colors">
              ← Main Dashboard
           </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <Card title="Score Trend (%)" className="p-10 border-teal-100 bg-white">
              <div className="h-80 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.lineData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} domain={[0, 100]} />
                       <Tooltip 
                          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
                          cursor={{ stroke: "#0d9488", strokeWidth: 2 }}
                       />
                       <Line type="monotone" dataKey="percentage" stroke="#0d9488" strokeWidth={4} dot={{ r: 6, fill: "#0d9488", strokeWidth: 2 }} activeDot={{ r: 8 }} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           <Card title="Subject Proficiency (%)" className="p-10 border-teal-100 bg-white">
              <div className="h-80 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.barData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} domain={[0, 100]} />
                       <Tooltip 
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
                       />
                       <Bar dataKey="average" radius={[8, 8, 0, 0]}>
                          {data.barData.map((_, index: number) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </Card>
        </div>

        <section className="bg-white p-10 rounded-3xl border border-teal-100 shadow-sm text-center space-y-4">
           <div className="text-4xl">🌟</div>
           <h3 className="text-2xl font-black text-gray-900 leading-tight">Keep Pushing Forward!</h3>
           <p className="text-gray-500 font-medium max-w-lg mx-auto">Your consistent progress is the key to mastering your subjects. Review your weak areas and aim for 100% in your next test.</p>
        </section>
      </div>
    </div>
  )
}
