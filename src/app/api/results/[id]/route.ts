import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params
  const isAdmin = session.user.role === "ADMIN"

  const test = await prisma.test.findUnique({
    where: { id },
    select: { title: true, subject: true, createdBy: true }
  })

  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 })
  }

  // Teacher can only see results for their own tests
  if (!isAdmin && test.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = await prisma.result.findMany({
    where: { testId: id },
    include: { 
      student: { select: { name: true, admno: true, class: true, section: true } }
    },
    orderBy: { score: "desc" }
  })

  return NextResponse.json({ results, test })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params
  const isAdmin = session.user.role === "ADMIN"

  const test = await prisma.test.findUnique({
    where: { id },
    select: { createdBy: true }
  })

  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 })
  }

  if (!isAdmin && test.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const resultId = searchParams.get("resultId")

    if (!resultId) {
       return NextResponse.json({ error: "Result ID is required" }, { status: 400 })
    }

    await prisma.result.delete({
      where: { id: resultId }
    })

    return NextResponse.json({ success: true, message: "Result deleted successfully." })
  } catch (error) {
    console.error("Error deleting result:", error)
    return NextResponse.json({ error: "Failed to delete result" }, { status: 500 })
  }
}
