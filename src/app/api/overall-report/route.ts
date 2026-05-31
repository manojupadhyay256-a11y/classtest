import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const className = searchParams.get("class")
  const testIdsParam = searchParams.get("testIds")

  if (!className || !testIdsParam) {
    return NextResponse.json({ error: "Missing class or testIds parameter" }, { status: 400 })
  }

  const testIds = testIdsParam.split(",").filter(Boolean)

  if (testIds.length === 0) {
    return NextResponse.json({ error: "No test IDs provided" }, { status: 400 })
  }

  try {
    // Fetch selected tests
    const tests = await prisma.test.findMany({
      where: { id: { in: testIds } },
      select: {
        id: true,
        title: true,
        subject: true,
        class: true,
        sections: true,
        questions: {
          select: { marks: true }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    if (tests.length === 0) {
      return NextResponse.json({ error: "No tests found" }, { status: 404 })
    }

    // Calculate total marks per test from questions
    const testsWithMarks = tests.map(test => ({
      id: test.id,
      title: test.title,
      subject: test.subject,
      totalMarks: test.questions.reduce((sum, q) => sum + q.marks, 0),
      sections: test.sections
    }))

    // Collect all unique sections from selected tests
    const allSections = Array.from(new Set(tests.flatMap(t => t.sections)))

    // Fetch all students for this class and relevant sections
    const students = await prisma.student.findMany({
      where: {
        class: className,
        section: { in: allSections }
      },
      select: {
        admno: true,
        name: true,
        class: true,
        section: true,
      },
      orderBy: [
        { section: "asc" },
        { name: "asc" }
      ]
    })

    // Fetch all results for the selected tests
    const results = await prisma.result.findMany({
      where: {
        testId: { in: testIds }
      },
      select: {
        admno: true,
        testId: true,
        score: true,
        totalMarks: true,
      }
    })

    // Build a lookup: admno -> testId -> result
    const resultMap: Record<string, Record<string, { score: number; totalMarks: number }>> = {}
    for (const r of results) {
      if (!resultMap[r.admno]) resultMap[r.admno] = {}
      resultMap[r.admno][r.testId] = { score: r.score, totalMarks: r.totalMarks }
    }

    // Build student report data
    const studentReports = students.map(student => {
      const studentResults: Record<string, { score: number; totalMarks: number } | null> = {}
      let totalScore = 0
      let totalPossible = 0

      for (const test of testsWithMarks) {
        const result = resultMap[student.admno]?.[test.id] || null
        studentResults[test.id] = result

        if (result) {
          totalScore += result.score
          totalPossible += result.totalMarks
        } else {
          totalPossible += test.totalMarks
        }
      }

      const percentage = totalPossible > 0 ? Number(((totalScore / totalPossible) * 100).toFixed(1)) : 0

      return {
        admno: student.admno,
        name: student.name,
        section: student.section,
        results: studentResults,
        totalScore,
        totalPossible,
        percentage
      }
    })

    return NextResponse.json({
      tests: testsWithMarks,
      students: studentReports,
      className
    })
  } catch (error) {
    console.error("Overall Report Error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
