import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { put } from "@vercel/blob"

export const dynamic = "force-dynamic"

// GET /api/notes — list notes (admin sees all, teacher sees own)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = session.user.role === "ADMIN"

  const notes = await prisma.note.findMany({
    where: isAdmin ? {} : { uploadedBy: session.user.id },
    include: {
      teacher: { select: { id: true, name: true, email: true, role: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(notes)
}

// POST /api/notes — upload a new PDF or HTML note
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()

    const title = formData.get("title") as string
    const subject = formData.get("subject") as string
    const chapter = formData.get("chapter") as string
    const cls = formData.get("class") as string
    const sectionsRaw = formData.get("sections") as string
    const instructions = (formData.get("instructions") as string) || null
    const file = formData.get("file") as File

    if (!title || !subject || !chapter || !cls || !sectionsRaw || !file) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const sections = JSON.parse(sectionsRaw) as string[]
    if (sections.length === 0) {
      return NextResponse.json({ error: "Select at least one section" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "text/html"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF and HTML files are allowed" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const blob = await put(`notes/${Date.now()}-${safeName}`, file, {
      access: "public",
    })

    const note = await prisma.note.create({
      data: {
        title,
        subject,
        chapter,
        class: cls,
        sections,
        fileName: file.name,
        fileUrl: blob.url,
        instructions: instructions || undefined,
        uploadedBy: session.user.id as string,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (err: unknown) {
    const error = err as Error
    console.error("Notes upload error:", error)
    console.error("Error Message:", error.message)
    console.error("Error Stack:", error.stack)
    return NextResponse.json({ 
      error: "Failed to upload note", 
      details: error.message 
    }, { status: 500 })
  }
}
