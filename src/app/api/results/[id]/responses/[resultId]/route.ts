import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { id: string; resultId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: testId, resultId } = params
  const isAdmin = session.user.role === "ADMIN"

  // Verify the test belongs to this teacher (or user is admin)
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { createdBy: true }
  })

  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 })
  }

  if (!isAdmin && test.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch the result with full student and question details
  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      student: { select: { name: true, admno: true, class: true, section: true } },
      test: {
        include: {
          questions: { orderBy: { order: "asc" } }
        }
      }
    }
  })

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 })
  }

  // Verify the result belongs to this test
  if (result.testId !== testId) {
    return NextResponse.json({ error: "Result does not belong to this test" }, { status: 400 })
  }

  return NextResponse.json(result)
}
