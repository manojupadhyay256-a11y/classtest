import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await prisma.result.findUnique({
    where: { id: params.id },
    include: {
      test: {
        include: { questions: { orderBy: { order: "asc" } } }
      },
      student: { select: { name: true, admno: true } }
    }
  })

  if (!result) return NextResponse.json({ error: "Result not found" }, { status: 404 })

  // Security check: only the student themselves or a teacher can view this
  if (session.user.role === "STUDENT" && result.admno !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(result)
}
