import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// POST /api/student/feedback — Submit new feedback
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { area, isLiked, comment } = body

    if (!area) {
      return NextResponse.json({ error: "Area is required" }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        studentId: session.user.id as string,
        area: area as string,
        isLiked: Boolean(isLiked),
        comment: comment as string | undefined
      }
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Feedback submission error:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}

// GET /api/student/feedback — Get student's own feedback history
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { studentId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error("Feedback fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch feedback history" }, { status: 500 })
  }
}
