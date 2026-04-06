import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = await prisma.result.findMany({
    where: { admno: session.user.email! },
    include: { test: true },
    orderBy: { submittedAt: "asc" }
  })

  // Group by subject and calculate average
  const subjectAverages: Record<string, { total: number, count: number }> = {}
  results.forEach(r => {
    const sub = r.test.subject
    if (!subjectAverages[sub]) subjectAverages[sub] = { total: 0, count: 0 }
    subjectAverages[sub].total += (r.score / r.totalMarks) * 100
    subjectAverages[sub].count++
  })

  const barData = Object.entries(subjectAverages).map(([subject, data]) => ({
    subject,
    average: parseFloat((data.total / data.count).toFixed(1))
  }))

  const lineData = results.map(r => ({
    date: new Date(r.submittedAt).toLocaleDateString(),
    percentage: parseFloat(((r.score / r.totalMarks) * 100).toFixed(1))
  }))

  return NextResponse.json({ barData, lineData })
}
