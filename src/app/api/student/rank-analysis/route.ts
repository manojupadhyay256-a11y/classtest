import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

interface TestAnalysis {
  testId: string
  title: string
  subject: string
  date: string
  totalMarks: number
  // Student's own performance
  studentScore: number
  studentPercentage: number
  // Section-level stats
  sectionRank: number
  sectionTotal: number
  sectionTopperScore: number
  sectionTopperName: string
  sectionAverage: number
  // Class-level stats (all sections)
  classRank: number
  classTotal: number
  classTopperScore: number
  classTopperName: string
  classAverage: number
  // Derived
  status: "topper" | "above_avg" | "average" | "below_avg" | "needs_work"
}

interface OverallStats {
  studentAvgPercentage: number
  // Section
  sectionRank: number
  sectionTotal: number
  sectionTopperAvg: number
  sectionTopperName: string
  sectionAverage: number
  // Class
  classRank: number
  classTotal: number
  classTopperAvg: number
  classTopperName: string
  classAverage: number
}

function getStatus(studentPct: number, avgPct: number, rank: number): TestAnalysis["status"] {
  if (rank === 1) return "topper"
  if (studentPct >= avgPct + 15) return "above_avg"
  if (studentPct >= avgPct - 5) return "average"
  if (studentPct >= avgPct - 20) return "below_avg"
  return "needs_work"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const student = await prisma.student.findUnique({
    where: { admno: session.user.email! },
  })

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  // 1. Get all results for THIS student (with test info)
  const myResults = await prisma.result.findMany({
    where: { admno: student.admno },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          subject: true,
          class: true,
          sections: true,
          createdAt: true,
          questions: { select: { marks: true } },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  })

  if (myResults.length === 0) {
    return NextResponse.json({
      tests: [],
      overall: null,
      recommendations: { needsRevision: [], strongChapters: [] },
    })
  }

  // 2. For each test, fetch ALL results (all students in that test)
  const testIds = myResults.map((r) => r.testId)

  const allResults = await prisma.result.findMany({
    where: { testId: { in: testIds } },
    include: {
      student: { select: { admno: true, name: true, section: true, class: true } },
    },
  })

  // Group results by testId
  const resultsByTest: Record<
    string,
    Array<{
      admno: string
      name: string
      section: string
      score: number
      totalMarks: number
      percentage: number
    }>
  > = {}

  for (const r of allResults) {
    if (!resultsByTest[r.testId]) resultsByTest[r.testId] = []
    resultsByTest[r.testId].push({
      admno: r.student.admno,
      name: r.student.name,
      section: r.student.section,
      score: r.score,
      totalMarks: r.totalMarks,
      percentage: r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0,
    })
  }

  // 3. Compute per-test analysis
  const testAnalyses: TestAnalysis[] = []

  for (const myResult of myResults) {
    const testResults = resultsByTest[myResult.testId] || []
    const totalMarks =
      myResult.test.questions.reduce((sum, q) => sum + q.marks, 0) || myResult.totalMarks

    const studentPct = totalMarks > 0 ? (myResult.score / totalMarks) * 100 : 0

    // Section-level computation
    const sectionResults = testResults.filter((r) => r.section === student.section)
    const sectionScores = sectionResults.map((r) => r.score).sort((a, b) => b - a)
    const sectionRank = sectionScores.indexOf(myResult.score) + 1
    // Handle ties: find first occurrence
    const actualSectionRank =
      sectionScores.findIndex((s) => s <= myResult.score && s === myResult.score) + 1
    const sectionTopper = sectionResults.reduce(
      (best, r) => (r.score > best.score ? r : best),
      sectionResults[0]
    )
    const sectionAvg =
      sectionResults.length > 0
        ? sectionResults.reduce((sum, r) => sum + r.score, 0) / sectionResults.length
        : 0

    // Class-level computation (all sections)
    const classScores = testResults.map((r) => r.score).sort((a, b) => b - a)
    const actualClassRank =
      classScores.findIndex((s) => s <= myResult.score && s === myResult.score) + 1
    const classTopper = testResults.reduce(
      (best, r) => (r.score > best.score ? r : best),
      testResults[0]
    )
    const classAvg =
      testResults.length > 0
        ? testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length
        : 0

    const classAvgPct = totalMarks > 0 ? (classAvg / totalMarks) * 100 : 0

    testAnalyses.push({
      testId: myResult.testId,
      title: myResult.test.title,
      subject: myResult.test.subject,
      date: myResult.test.createdAt.toISOString(),
      totalMarks,
      studentScore: myResult.score,
      studentPercentage: Number(studentPct.toFixed(1)),
      sectionRank: actualSectionRank || sectionRank,
      sectionTotal: sectionResults.length,
      sectionTopperScore: sectionTopper?.score ?? 0,
      sectionTopperName: sectionTopper?.name ?? "N/A",
      sectionAverage: Number(sectionAvg.toFixed(1)),
      classRank: actualClassRank,
      classTotal: testResults.length,
      classTopperScore: classTopper?.score ?? 0,
      classTopperName: classTopper?.name ?? "N/A",
      classAverage: Number(classAvg.toFixed(1)),
      status: getStatus(studentPct, classAvgPct, actualClassRank),
    })
  }

  // 4. Compute overall rank across all tests
  //    Each student's "overall score" = average percentage across all tests they took
  //    We only consider tests that the current student has taken

  // Get all students in same class
  const classStudents = await prisma.student.findMany({
    where: { class: student.class },
    select: { admno: true, name: true, section: true },
  })

  // Compute average percentage for each student (only for the same tests)
  const studentAverages: Array<{
    admno: string
    name: string
    section: string
    avgPercentage: number
    testsTaken: number
  }> = []

  for (const s of classStudents) {
    const studentTestResults = allResults.filter((r) => r.admno === s.admno)
    if (studentTestResults.length === 0) continue

    const avgPct =
      studentTestResults.reduce((sum, r) => {
        return sum + (r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0)
      }, 0) / studentTestResults.length

    studentAverages.push({
      admno: s.admno,
      name: s.name,
      section: s.section,
      avgPercentage: Number(avgPct.toFixed(1)),
      testsTaken: studentTestResults.length,
    })
  }

  // Sort by average percentage (descending)
  studentAverages.sort((a, b) => b.avgPercentage - a.avgPercentage)

  // Find current student's position
  const myAvg = studentAverages.find((s) => s.admno === student.admno)

  // Section-level overall
  const sectionAverages = studentAverages.filter((s) => s.section === student.section)
  const sectionRankOverall = sectionAverages.findIndex((s) => s.admno === student.admno) + 1
  const sectionTopperOverall = sectionAverages[0]
  const sectionAvgOverall =
    sectionAverages.length > 0
      ? sectionAverages.reduce((sum, s) => sum + s.avgPercentage, 0) / sectionAverages.length
      : 0

  // Class-level overall
  const classRankOverall = studentAverages.findIndex((s) => s.admno === student.admno) + 1
  const classTopperOverall = studentAverages[0]
  const classAvgOverall =
    studentAverages.length > 0
      ? studentAverages.reduce((sum, s) => sum + s.avgPercentage, 0) / studentAverages.length
      : 0

  const overall: OverallStats | null = myAvg
    ? {
        studentAvgPercentage: myAvg.avgPercentage,
        sectionRank: sectionRankOverall,
        sectionTotal: sectionAverages.length,
        sectionTopperAvg: sectionTopperOverall?.avgPercentage ?? 0,
        sectionTopperName: sectionTopperOverall?.name ?? "N/A",
        sectionAverage: Number(sectionAvgOverall.toFixed(1)),
        classRank: classRankOverall,
        classTotal: studentAverages.length,
        classTopperAvg: classTopperOverall?.avgPercentage ?? 0,
        classTopperName: classTopperOverall?.name ?? "N/A",
        classAverage: Number(classAvgOverall.toFixed(1)),
      }
    : null

  // 5. Generate recommendations
  const needsRevision = testAnalyses
    .filter((t) => t.status === "below_avg" || t.status === "needs_work")
    .map((t) => ({
      title: t.title,
      subject: t.subject,
      studentPct: t.studentPercentage,
      classPct: Number(((t.classAverage / t.totalMarks) * 100).toFixed(1)),
      gap: Number(
        (((t.classAverage / t.totalMarks) * 100) - t.studentPercentage).toFixed(1)
      ),
    }))
    .sort((a, b) => b.gap - a.gap)

  const strongChapters = testAnalyses
    .filter((t) => t.status === "topper" || t.status === "above_avg")
    .map((t) => ({
      title: t.title,
      subject: t.subject,
      studentPct: t.studentPercentage,
      rank: t.classRank,
    }))
    .sort((a, b) => a.rank - b.rank)

  return NextResponse.json({
    tests: testAnalyses,
    overall,
    recommendations: { needsRevision, strongChapters },
    studentInfo: {
      name: student.name,
      class: student.class,
      section: student.section,
    },
  })
}
