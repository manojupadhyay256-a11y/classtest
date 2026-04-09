import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/admin/feedback — List all feedback with student details
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        student: {
          select: {
            name: true,
            class: true,
            section: true,
            admno: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error("Admin feedback fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch all feedback" }, { status: 500 })
  }
}
