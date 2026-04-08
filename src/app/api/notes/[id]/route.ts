import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { del } from "@vercel/blob"

// DELETE /api/notes/[id]
export async function DELETE(
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

  // Teachers can only delete their own notes
  if (session.user.role === "TEACHER" && note.uploadedBy !== session.user.id) {
    return NextResponse.json({ error: "You can only delete your own notes" }, { status: 403 })
  }

  try {
    // Delete from Vercel Blob
    await del(note.fileUrl)
    // Delete from database
    await prisma.note.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Note delete error:", err)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
