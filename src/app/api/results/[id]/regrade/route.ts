import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

interface RegradeDetail {
  admno: string
  studentName: string
  oldScore: number
  newScore: number
  totalMarks: number
  changes: {
    questionOrder: number
    questionText: string
    studentAnswer: string
    correctAnswer: string
    aiVerdict: string
    marksAwarded: number
  }[]
}

async function evaluateWithAI(
  questionText: string,
  correctAnswer: string,
  studentAnswer: string,
  questionType: string
): Promise<{ accepted: boolean; reason: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `You are a strict but fair school exam evaluator. Evaluate whether a student's answer is acceptable.

Question Type: ${questionType === "fill" ? "Fill in the Blank" : "Short Answer"}
Question: ${questionText}
Expected Correct Answer: ${correctAnswer}
Student's Answer: ${studentAnswer}

Rules:
1. For fill-in-the-blank: You MUST ACCEPT the answer if it contains the correct concept, even if the student redundantly included words from the question text. For example, if the question is "called a ______ key." and expected answer is "composite", you MUST ACCEPT "composite key" or "Composite key". Do NOT penalize for repeating context words.
2. For short answers: Accept if the core meaning matches the correct answer. Minor phrasing differences are OK.
3. Be lenient with capitalization, punctuation, extra spaces, and minor typos.
4. If the student's answer is blank or clearly irrelevant, reject it.
5. If the student has given an answer like "memo" and "memo/longvarchar" is the correct answer, then accept it as correct.
6. Accept conceptually similar terminology. For example, if the expected answer is "data redundancy" and the student answers "data inconsistency", you MUST ACCEPT IT. Similarly, accept "file database" for "flat file", "table" for "tabular", and "insert" for "insert into".

Reply in EXACTLY this format (no extra text):
VERDICT: YES or NO
REASON: One brief sentence explaining why`

    const result = await model.generateContent(prompt)
    const response = result.response.text().trim()

    const verdictMatch = response.match(/VERDICT:\s*(YES|NO)/i)
    const reasonMatch = response.match(/REASON:\s*(.+)/i)

    return {
      accepted: verdictMatch ? verdictMatch[1].toUpperCase() === "YES" : false,
      reason: reasonMatch ? reasonMatch[1].trim() : response
    }
  } catch (error) {
    console.error("AI evaluation error:", error)
    return { accepted: false, reason: "AI evaluation failed" }
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only Admins can regrade tests" }, { status: 403 })
  }

  const { id: testId } = params

  // Optional section filter from query params
  const { searchParams } = new URL(req.url)
  const sectionFilter = searchParams.get("section")

  try {
    // Fetch test with questions
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { order: "asc" } } }
    })

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    // Get fill and short questions only
    const fillShortQuestions = test.questions.filter(
      q => q.questionType === "fill" || q.questionType === "short"
    )

    if (fillShortQuestions.length === 0) {
      return NextResponse.json({
        message: "No fill-in-the-blank or short answer questions found in this test",
        checked: 0,
        updated: 0,
        details: []
      })
    }

    // Fetch results, optionally filtered by section
    const results = await prisma.result.findMany({
      where: {
        testId,
        ...(sectionFilter ? { student: { section: sectionFilter } } : {})
      },
      include: {
        student: { select: { name: true, admno: true, section: true } }
      }
    })

    if (results.length === 0) {
      return NextResponse.json({
        message: "No results found for this test" + (sectionFilter ? ` in section ${sectionFilter}` : ""),
        checked: 0,
        updated: 0,
        details: []
      })
    }

    const regradeDetails: RegradeDetail[] = []
    let totalUpdated = 0

    // Process each result
    for (const result of results) {
      const answers = result.answers as Record<string, string>
      let additionalMarks = 0
      const changes: RegradeDetail["changes"] = []

      for (const q of fillShortQuestions) {
        const studentAnswer = answers[q.id]?.toString().trim() || ""
        const correctAnswer = q.correctAnswer.trim()

        // Skip if student didn't answer
        if (!studentAnswer) continue

        // Check if student already got it right with deterministic grading
        const validAnswers = correctAnswer.split(",").map(a => a.trim().toLowerCase())
        const alreadyCorrect = validAnswers.includes(studentAnswer.toLowerCase())

        if (alreadyCorrect) continue // Already correct, skip

        // Send to AI for evaluation
        const aiResult = await evaluateWithAI(
          q.questionText,
          correctAnswer,
          studentAnswer,
          q.questionType
        )

        if (aiResult.accepted) {
          additionalMarks += q.marks
          changes.push({
            questionOrder: q.order,
            questionText: q.questionText,
            studentAnswer,
            correctAnswer,
            aiVerdict: aiResult.reason,
            marksAwarded: q.marks
          })
        }
      }

      // Update score if AI found additional correct answers
      if (additionalMarks > 0) {
        const newScore = result.score + additionalMarks

        await prisma.result.update({
          where: { id: result.id },
          data: { score: newScore }
        })

        totalUpdated++
        regradeDetails.push({
          admno: result.admno,
          studentName: result.student.name,
          oldScore: result.score,
          newScore,
          totalMarks: result.totalMarks,
          changes
        })
      }
    }

    return NextResponse.json({
      message: `Regrade complete. ${totalUpdated} of ${results.length} scores updated.`,
      checked: results.length,
      updated: totalUpdated,
      details: regradeDetails
    })
  } catch (error) {
    console.error("Regrade Error:", error)
    return NextResponse.json({ error: "Regrade failed. Please try again." }, { status: 500 })
  }
}
