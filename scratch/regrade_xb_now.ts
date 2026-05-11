import { PrismaClient } from "@prisma/client"
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as dotenv from "dotenv"

dotenv.config()

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function evaluateWithAI(
  questionText: string,
  correctAnswer: string,
  studentAnswer: string,
  questionType: string,
  retryCount = 0
): Promise<{ accepted: boolean; reason: string }> {
  try {
    // Add a 35-second delay between requests to stay under 2 RPM (Free Tier)
    await sleep(35000)

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
5. if student has given answer like memo and memo/longvarchar is the correct answer then accept it as correct answer

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
  } catch (error: any) {
    if (error.status === 429 && retryCount < 3) {
      const delay = 60000 // Wait 60 seconds if rate limited
      console.log(`  [RATE LIMITED] Waiting ${delay / 1000}s before retry ${retryCount + 1}...`)
      await sleep(delay)
      return evaluateWithAI(questionText, correctAnswer, studentAnswer, questionType, retryCount + 1)
    }
    console.error("AI evaluation error:", error)
    return { accepted: false, reason: "AI evaluation failed" }
  }
}

async function main() {
  const testId = "cmosoacwn0002ju04b7x657jk"
  const sectionFilter = "B"

  console.log(`Starting regrade for Test: ${testId}, Section: ${sectionFilter}`)

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { questions: { orderBy: { order: "asc" } } }
  })

  if (!test) {
    console.error("Test not found")
    return
  }

  const fillShortQuestions = test.questions.filter(
    q => q.questionType === "fill" || q.questionType === "short"
  )

  if (fillShortQuestions.length === 0) {
    console.log("No fill/short questions to regrade.")
    return
  }

  const results = await prisma.result.findMany({
    where: {
      testId,
      student: { section: sectionFilter, class: "X" }
    },
    include: {
      student: { select: { name: true, admno: true } }
    }
  })

  console.log(`Found ${results.length} results to check.`)

  for (const result of results) {
    console.log(`Checking result for ${result.student.name} (${result.student.admno})...`)
    const answers = result.answers as Record<string, string>
    let additionalMarks = 0

    for (const q of fillShortQuestions) {
      const studentAnswer = answers[q.id]?.toString().trim() || ""
      const correctAnswer = q.correctAnswer.trim()

      if (!studentAnswer) continue

      const validAnswers = correctAnswer.split(",").map(a => a.trim().toLowerCase())
      const alreadyCorrect = validAnswers.includes(studentAnswer.toLowerCase())

      if (alreadyCorrect) continue

      const aiResult = await evaluateWithAI(
        q.questionText,
        correctAnswer,
        studentAnswer,
        q.questionType
      )

      if (aiResult.accepted) {
        console.log(`  [ACCEPTED] Question ${q.order}: "${studentAnswer}" (Expected: "${correctAnswer}") - ${aiResult.reason}`)
        additionalMarks += q.marks
      } else {
        console.log(`  [REJECTED] Question ${q.order}: "${studentAnswer}" (Expected: "${correctAnswer}") - ${aiResult.reason}`)
      }
    }

    if (additionalMarks > 0) {
      const newScore = result.score + additionalMarks
      console.log(`  Updating score from ${result.score} to ${newScore}`)
      await prisma.result.update({
        where: { id: result.id },
        data: { score: newScore }
      })
    } else {
      console.log("  No score update needed.")
    }
  }

  console.log("Regrade complete.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
