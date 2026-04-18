import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Card from "@/components/ui/card"
import prisma from "@/lib/prisma"
import Link from "next/link"
import TestStatusToggle from "@/components/admin/test-status-toggle"

export const dynamic = "force-dynamic"

export default async function TestsListPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "ADMIN"

  const tests = await prisma.test.findMany({
    where: isAdmin ? {} : { createdBy: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { 
      _count: { select: { questions: true, results: true } },
      teacher: { select: { name: true } }
    }
  })

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Manage Tests</h1>
          <p className="text-slate-400 text-sm">Create, edit, and toggle your tests</p>
        </div>
        <Link 
          href="/admin/tests/create"
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm w-full sm:w-auto text-center"
        >
          + New Test
        </Link>
      </header>

      <Card title="Your Tests">
        {/* Mobile Card View */}
        <div className="block md:hidden space-y-3">
          {tests.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No tests created yet.</div>
          ) : (
            tests.map((test) => (
              <div key={test.id} className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{test.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {test.class}-{test.sections.join(", ")} · {test.subject}
                    </p>
                  </div>
                  <TestStatusToggle id={test.id} isActive={test.isActive} />
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                  <span>{test._count.questions} Questions</span>
                  <span>{test._count.results} Submissions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Link href={`/student/test/${test.id}?mode=preview`} className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase transition-colors">Preview</Link>
                  <Link href={`/admin/tests/${test.id}/setup`} className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase transition-colors">Edit Info</Link>
                  <Link href={`/admin/tests/${test.id}/edit`} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase transition-colors">Edit Qs</Link>
                  <Link href={`/admin/results/${test.id}`} className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase transition-colors">Results</Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Class/Sec</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Qs/Submits</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tests.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No tests created yet.</td></tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 text-sm">{test.title}</td>
                    <td className="py-3 px-3 text-slate-600 text-sm font-medium">{test.class} - {test.sections.join(", ")}</td>
                    <td className="py-3 px-3 text-slate-600 text-sm">{test.subject}</td>
                    <td className="py-3 px-3 text-center">
                      <TestStatusToggle id={test.id} isActive={test.isActive} />
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-500 text-sm">
                      {test._count.questions} / {test._count.results}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/student/test/${test.id}?mode=preview`} className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-colors">Preview</Link>
                        <Link href={`/admin/tests/${test.id}/setup`} className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-colors">Edit Info</Link>
                        <Link href={`/admin/tests/${test.id}/edit`} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-colors">Edit Qs</Link>
                        <Link href={`/admin/results/${test.id}`} className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-colors">Results</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
