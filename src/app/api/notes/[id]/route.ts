import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { del, put } from "@vercel/blob"

// PUT /api/notes/[id] — update note metadata and optionally replace file
export async function PUT(
  req: NextRequest,
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

  // Teachers can only edit their own notes
  if (session.user.role === "TEACHER" && note.uploadedBy !== session.user.id) {
    return NextResponse.json({ error: "You can only edit your own notes" }, { status: 403 })
  }

  try {
    const formData = await req.formData()

    const title = formData.get("title") as string
    const subject = formData.get("subject") as string
    const chapter = formData.get("chapter") as string
    const cls = formData.get("class") as string
    const sectionsRaw = formData.get("sections") as string
    const instructions = (formData.get("instructions") as string) || null
    const file = formData.get("file") as File | null

    if (!title || !subject || !chapter || !cls || !sectionsRaw) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const sections = JSON.parse(sectionsRaw) as string[]
    if (sections.length === 0) {
      return NextResponse.json({ error: "Select at least one section" }, { status: 400 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      title,
      subject,
      chapter,
      class: cls,
      sections,
      instructions: instructions || undefined,
    }

    // If a new file is provided, upload it and delete the old one
    if (file && file.size > 0) {
      const allowedTypes = ["application/pdf", "text/html"]
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Only PDF and HTML files are allowed" }, { status: 400 })
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const blob = await put(`notes/${Date.now()}-${safeName}`, file, {
        access: "public",
      })

      // Delete old blob
      try { await del(note.fileUrl) } catch { /* old blob may already be gone */ }

      updateData.fileName = file.name
      updateData.fileUrl = blob.url
    }

    const updated = await prisma.note.update({
      where: { id: params.id },
      data: updateData,
      include: {
        teacher: { select: { id: true, name: true, email: true, role: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const error = err as Error
    console.error("Note update error:", error)
    return NextResponse.json({
      error: "Failed to update note",
      details: error.message
    }, { status: 500 })
  }
}

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
