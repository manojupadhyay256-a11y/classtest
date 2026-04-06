import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const students = await prisma.student.findMany({
      orderBy: { name: "asc" },
      select: { 
        admno: true, 
        name: true, 
        class: true, 
        section: true 
        // Exclude password and other internal fields
      }
    })
    return NextResponse.json(students)
  } catch (error) {
    console.error("GET Students Error:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}


export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only Admin can create or upload students
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Only Admins can manage student records" }, { status: 403 })
  }

  try {
    const rawData = await req.json()

    if (Array.isArray(rawData)) {
      // Normalize keys and filter out empty rows
      const data = rawData.map((row: Record<string, unknown>) => {
        const normalized: Record<string, unknown> = {}
        Object.keys(row).forEach(key => {
          const k = key.toLowerCase().trim().replace(/[\s_]/g, '')
          // Map likely variations
          if (k === 'admno' || k === 'admissionno' || k === 'rollno') normalized.admno = row[key]
          else if (k === 'name' || k === 'studentname') normalized.name = row[key]
          else if (k === 'class' || k === 'grade' || k === 'std' || k === 'classname' || k === 'level') normalized.class = row[key]
          else if (k === 'section' || k === 'sections' || k === 'sect' || k === 'sects') normalized.section = row[key]
          else normalized[key] = row[key]
        })
        return normalized
      })

      // Filter out rows that are missing required fields
      const validData = data.filter((s: Record<string, unknown>) => 
        s && 
        (s.admno !== undefined && s.admno !== null && String(s.admno).trim() !== "") && 
        (s.name !== undefined && s.name !== null && String(s.name).trim() !== "") && 
        (s.class !== undefined && s.class !== null && String(s.class).trim() !== "") && 
        (s.section !== undefined && s.section !== null && String(s.section).trim() !== "")
      )

      if (validData.length === 0) {
        console.log("No valid records found. Data received:", data.slice(0, 2))
        return NextResponse.json({ count: 0, message: "No valid student records found. Check headers: admno, name, class, section" })
      }

      const studentsToCreate = await Promise.all(validData.map(async (s: Record<string, unknown>) => {
        const admnoStr = String(s.admno).trim()
        const hashedPassword = await bcrypt.hash(admnoStr, 10)
        return {
          admno: admnoStr,
          name: String(s.name).trim(),
          class: String(s.class).trim(),
          section: String(s.section).trim(),
          password: hashedPassword,
        }
      }))

      const result = await prisma.$transaction(async (tx) => {
        return Promise.all(
          studentsToCreate.map(s => tx.student.upsert({
            where: { admno: s.admno },
            update: { name: s.name, class: s.class, section: s.section },
            create: s
          }))
        )
      }, { timeout: 30000 })
      return NextResponse.json({ count: result.length })
    }
    
    // Individual creation
    const { admno, name, class: className, section } = rawData
    
    if (!admno || !name || !className || !section) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(admno.toString(), 10)
    const student = await prisma.student.upsert({
      where: { admno: admno.toString() },
      update: { name, class: className, section },
      create: {
        admno: admno.toString(),
        name,
        class: className,
        section,
        password: hashedPassword,
      }
    })
    
    return NextResponse.json(student)
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Student API Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only Admins can delete student records" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const admno = searchParams.get("admno")

  if (!admno) return NextResponse.json({ error: "Missing admno" }, { status: 400 })

  await prisma.student.delete({ where: { admno } })
  return NextResponse.json({ success: true })
}
