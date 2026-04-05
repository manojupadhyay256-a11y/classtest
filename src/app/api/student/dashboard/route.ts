import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
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
      section: student.section,
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

  return NextResponse.json({ 
    availableTests, 
    results,
    stats: {
      totalTests,
      avgPercentage: Math.round(avgPercentage),
      lastAttemptDate
    }
  })
}
