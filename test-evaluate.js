require('dotenv').config({ path: '.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function evaluateWithAI(
  questionText,
  studentAnswer,
  questionType,
  maxMarks,
  retries = 3
) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })

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

    await sleep(2000); 

    const result = await model.generateContent(prompt)
    const response = result.response.text().trim()

    const marksMatch = response.match(/MARKS:\s*(\d+(?:\.\d+)?)/i)
    const reasonMatch = response.match(/REASON:\s*(.+)/i)

    let marks = marksMatch ? parseFloat(marksMatch[1]) : 0
    marks = Math.max(0, Math.min(maxMarks, marks))

    return {
      marksAwarded: marks,
      reason: reasonMatch ? reasonMatch[1].trim() : response,
      raw: response
    }
  } catch (error) {
    if (error?.status === 429 && retries > 0) {
      console.warn(`[AI Regrade] Rate limited (429). Retrying in 5s... (${retries} retries left)`);
      await sleep(5000);
      return evaluateWithAI(questionText, studentAnswer, questionType, maxMarks, retries - 1);
    }
    console.error("AI evaluation error:", error)
    return { marksAwarded: 0, reason: "AI evaluation failed" }
  }
}

async function run() {
  const qText = "State any two advantages of using a Database.";
  const sAns = "1. we can reduce the data inconsistancy and 2. duplicaty can be removed";
  console.log("Evaluating...");
  const res = await evaluateWithAI(qText, sAns, "fill", 1);
  console.log("Result:", res);
}

run();
