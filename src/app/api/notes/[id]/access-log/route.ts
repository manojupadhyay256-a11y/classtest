import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/notes/[id]/access-log — returns the access log for a note (admin/teacher only)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const note = await prisma.note.findUnique({ where: { id: params.id } })
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 })
  }

  // Teachers can only see logs for their own notes
  if (session.user.role === "TEACHER" && note.uploadedBy !== session.user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const logs = await prisma.noteAccess.findMany({
    where: { noteId: params.id },
    orderBy: { accessedAt: "desc" },
  })

  return NextResponse.json(logs)
}
