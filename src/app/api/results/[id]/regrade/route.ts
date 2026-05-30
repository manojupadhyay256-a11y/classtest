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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function evaluateWithAI(
  questionText: string,
  studentAnswer: string,
  questionType: string,
  maxMarks: number,
  retries = 3
): Promise<{ marksAwarded: number; reason: string }> {
  try {
    // Replaced gemini-2.0-flash with gemini-1.5-flash to bypass API quota issues as requested
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `You are a strict but fair school exam evaluator. You must evaluate a student's answer using YOUR OWN KNOWLEDGE of the subject.

Question Type: ${questionType === "fill" ? "Fill in the Blank" : "Short Answer"}
Question: ${questionText}
Student's Answer: ${studentAnswer}
Maximum Marks: ${maxMarks}

GRADING RULES:
1. Use YOUR OWN knowledge to determine if the student's answer is factually correct.
2. Award marks based on how accurate and complete the answer is:
   - Full marks (${maxMarks}/${maxMarks}): Answer is correct, complete, and demonstrates understanding.
   - Partial marks: Answer is partially correct or incomplete but shows some understanding.
   - Zero marks (0/${maxMarks}): Answer is wrong, blank, or completely irrelevant.
3. For "Fill in the Blank" questions: Award full marks if the answer is factually correct. Be lenient with minor typos, capitalization, and extra words.
4. For "Short Answer" questions: Evaluate based on conceptual accuracy. The student doesn't need to match any specific phrasing — if the concept is right, award marks.
5. If the student wrote something partially correct, award proportional marks.

Reply in EXACTLY this format (no extra text):
MARKS: <number between 0 and ${maxMarks}>
REASON: <One brief sentence explaining why>`

    // Added a short delay to respect basic rate limits, plus retries for 429s
    await sleep(2000); 

    const result = await model.generateContent(prompt)
    const response = result.response.text().trim()

    const marksMatch = response.match(/MARKS:\s*(\d+(?:\.\d+)?)/i)
    const reasonMatch = response.match(/REASON:\s*(.+)/i)

    let marks = marksMatch ? parseFloat(marksMatch[1]) : 0
    // Ensure marks are within bounds
    marks = Math.max(0, Math.min(maxMarks, marks))

    return {
      marksAwarded: marks,
      reason: reasonMatch ? reasonMatch[1].trim() : response
    }
  } catch (error: unknown) {
    const err = error as { status?: number }
    if (err?.status === 429 && retries > 0) {
      console.warn(`[AI Regrade] Rate limited (429). Retrying in 5s... (${retries} retries left)`);
      await sleep(5000);
      return evaluateWithAI(questionText, studentAnswer, questionType, maxMarks, retries - 1);
    }
    console.error("AI evaluation error:", error)
    return { marksAwarded: 0, reason: "AI evaluation failed" }
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

    console.log(`[REGRADE] Found ${fillShortQuestions.length} fill/short questions:`, fillShortQuestions.map(q => ({ id: q.id, type: q.questionType, text: q.questionText.substring(0, 50) })))
    console.log(`[REGRADE] Processing ${results.length} results`)

    // Process each result
    for (const result of results) {
      const answers = result.answers as Record<string, string>
      let aiTotalMarks = 0
      const changes: RegradeDetail["changes"] = []

      console.log(`[REGRADE] Student: ${result.student.name}, Current Score: ${result.score}, Answers:`, JSON.stringify(answers))

      for (const q of fillShortQuestions) {
        const studentAnswer = answers[q.id]?.toString().trim() || ""

        console.log(`[REGRADE] Q: "${q.questionText.substring(0, 40)}" | Student Answer: "${studentAnswer}" | Type: ${q.questionType}`)

        // Skip if student didn't answer at all
        if (!studentAnswer) {
          console.log(`[REGRADE] -> Skipped (empty answer)`)
          continue
        }

        // Send EVERY fill/short answer to AI for evaluation using AI's own knowledge
        const aiResult = await evaluateWithAI(
          q.questionText,
          studentAnswer,
          q.questionType,
          q.marks
        )

        console.log(`[REGRADE] -> AI Result: ${aiResult.marksAwarded}/${q.marks} - ${aiResult.reason}`)

        aiTotalMarks += aiResult.marksAwarded
        changes.push({
          questionOrder: q.order,
          questionText: q.questionText,
          studentAnswer,
          correctAnswer: q.correctAnswer || "(AI self-evaluated)",
          aiVerdict: aiResult.reason,
          marksAwarded: aiResult.marksAwarded
        })
      }

      // Calculate the new score:
      // Start with the current score (which has 0 for fill/short from initial submission)
      // Then add the AI-awarded marks for fill/short questions
      // Since fill/short are always 0 in initial submission, new score = current score + aiTotalMarks
      const newScore = result.score + aiTotalMarks
      console.log(`[REGRADE] Total AI marks: ${aiTotalMarks}, Old Score: ${result.score}, New Score: ${newScore}`)

      if (newScore !== result.score) {
        await prisma.result.update({
          where: { id: result.id },
          data: { score: newScore }
        })

        totalUpdated++
      }

      if (changes.length > 0) {
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
