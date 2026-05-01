import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/notes/[id]/view — serve HTML notes inline for browser rendering
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const note = await prisma.note.findUnique({ where: { id: params.id } })

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 })
  }

  // Students can only view notes matching their class and section
  if (session.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { admno: session.user.id }
    })
    if (!student || note.class !== student.class || !note.sections.includes(student.section)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
  }

  // Fetch the file from Vercel Blob
  try {
    const response = await fetch(note.fileUrl)
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 })
    }

    const content = await response.arrayBuffer()
    const isHtml = /\.html?$/i.test(note.fileName)

    return new NextResponse(content, {
      headers: {
        "Content-Type": isHtml ? "text/html; charset=utf-8" : "application/pdf",
        "Content-Disposition": "inline",
      },
    })
  } catch (err) {
    console.error("Note view error:", err)
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 })
  }
}
