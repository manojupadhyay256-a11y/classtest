import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    
    // Only Admin can delete teachers
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Prevent deleting oneself
    if (id === session.user.id) {
        return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    try {
        // Find if teacher has tests
        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: { _count: { select: { tests: true } } }
        })

        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
        }

        if (teacher._count.tests > 0) {
            return NextResponse.json({ 
                error: `Cannot delete teacher. They have ${teacher._count.tests} tests assigned. Delete or reassign tests first.` 
            }, { status: 400 })
        }

        await prisma.teacher.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const err = error as Error;
        console.error("Delete Teacher Error:", err)
        return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 })
    }
}
