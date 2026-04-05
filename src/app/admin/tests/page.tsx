import Card from "@/components/ui/card"
import prisma from "@/lib/prisma"
import Link from "next/link"
import TestStatusToggle from "@/components/admin/test-status-toggle"

export default async function TestsListPage() {
  const tests = await prisma.test.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, results: true } } }
  })

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Tests</h1>
          <p className="text-gray-500">Create, edit, and toggle your tests</p>
        </div>
        <Link 
          href="/admin/tests/create"
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
        >
          + Create New Test
        </Link>
      </header>

      <Card title="Your Tests">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500 uppercase text-xs">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Class/Sec</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Qs/Submits</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tests.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No tests created yet.</td></tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-gray-900">{test.title}</td>
                    <td className="py-4 px-4 font-bold text-gray-900">{test.class} - {test.section}</td>
                    <td className="py-4 px-4 font-bold text-gray-900">{test.subject}</td>
                    <td className="py-4 px-4 text-center">
                      <TestStatusToggle id={test.id} isActive={test.isActive} />
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-gray-500">
                      {test._count.questions} / {test._count.results}
                    </td>
                    <td className="py-4 px-4 text-right space-x-3">
                      <Link href={`/admin/tests/${test.id}/edit`} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-black uppercase transition-colors">Edit</Link>
                      <Link href={`/admin/results/${test.id}`} className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1 rounded-md text-xs font-black uppercase transition-colors">Results</Link>
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
