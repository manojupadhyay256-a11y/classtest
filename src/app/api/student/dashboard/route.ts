import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const student = await prisma.student.findUnique({
    where: { admno: session.user.email! }
  })

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  // Find active tests for student's class and section
  // Also filter those already attempted (not implemented in this turn)
  const availableTests = await prisma.test.findMany({
    where: {
      class: student.class,
      sections: { has: student.section },
      isActive: true,
      // Optional: time window check
    },
    include: { _count: { select: { questions: true } } }
  })

  const results = await prisma.result.findMany({
    where: { admno: student.admno },
    include: { test: { select: { title: true, subject: true } } },
    orderBy: { submittedAt: 'desc' }
  })

  // Summary Statistics
  const totalTests = results.length
  const totalScore = results.reduce((acc, curr) => acc + (curr.score / curr.totalMarks), 0)
  const avgPercentage = totalTests > 0 ? (totalScore / totalTests) * 100 : 0
  const lastAttemptDate = results.length > 0 ? results[0].submittedAt : null

  // ── Rank Computation ──
  let sectionRank = 0
  let classRank = 0
  let totalInSection = 0
  let totalInClass = 0

  if (totalTests > 0) {
    const testIds = results.map(r => r.testId)

    // Fetch all results for the same tests
    const allResults = await prisma.result.findMany({
      where: { testId: { in: testIds } },
      include: { student: { select: { admno: true, section: true } } },
    })

    // Compute avg percentage per student
    const studentMap: Record<string, { section: string; totalPct: number; count: number }> = {}
    for (const r of allResults) {
      if (!studentMap[r.admno]) {
        studentMap[r.admno] = { section: r.student.section, totalPct: 0, count: 0 }
      }
      studentMap[r.admno].totalPct += r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0
      studentMap[r.admno].count++
    }

    const avgList = Object.entries(studentMap).map(([admno, data]) => ({
      admno,
      section: data.section,
      avg: data.totalPct / data.count,
    }))

    // Sort descending by avg
    avgList.sort((a, b) => b.avg - a.avg)

    // Class rank
    classRank = avgList.findIndex(s => s.admno === student.admno) + 1
    totalInClass = avgList.length

    // Section rank
    const sectionList = avgList.filter(s => s.section === student.section)
    sectionRank = sectionList.findIndex(s => s.admno === student.admno) + 1
    totalInSection = sectionList.length
  }

  return NextResponse.json({ 
    availableTests, 
    results,
    stats: {
      totalTests,
      avgPercentage: Math.round(avgPercentage),
      lastAttemptDate,
      sectionRank,
      classRank,
      totalInSection,
      totalInClass,
    }
  })
}
