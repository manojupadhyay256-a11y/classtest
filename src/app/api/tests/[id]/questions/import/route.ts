import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import mammoth from "mammoth"
import { Prisma } from "@prisma/client"

interface ParsedQuestion {
  testId: string
  questionText: string
  questionType: string
  marks: number
  correctAnswer: string
  options: Prisma.JsonValue
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = session.user.role === "ADMIN"

  try {
    // Check ownership if not admin
    if (!isAdmin) {
      const test = await prisma.test.findUnique({
        where: { id: params.id },
        select: { createdBy: true }
      })
      if (!test || test.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized: You can only import questions to your own tests" }, { status: 403 })
      }
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value

    const questions = parseQuestions(text, params.id)
    
    if (questions.length === 0) {
      return NextResponse.json({ error: "No valid questions found in file" }, { status: 400 })
    }

    // Get current max order
    const lastQuestion = await prisma.question.findFirst({
      where: { testId: params.id },
      orderBy: { order: "desc" }
    })
    const startOrder = lastQuestion ? lastQuestion.order + 1 : 1

    const questionsToCreate = questions.map((q, index) => ({
      ...q,
      order: startOrder + index
    }))

    await prisma.question.createMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: questionsToCreate as any
    })

    return NextResponse.json({ message: `Successfully imported ${questions.length} questions` })
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Import Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function parseQuestions(text: string, testId: string) {
  // Normalize colons and spaces
  let raw = text.replace(/\s+[:：]/g, ":"); 
  
  // Force newlines before keywords if they are mashed together in a single line
  raw = raw.replace(/(\s+)(Question|Q|Type|Marks|Options|Answer)[:：]/gi, "\n$2:");

  const lines = raw.split(/[\n\r]+/).map(l => l.trim()).filter(l => l);
  const questions: ParsedQuestion[] = [];
  
  let currentQ: ParsedQuestion | null = null;
  let mode: "none" | "options" | "answer" = "none";
  let answerLines: string[] = [];
  let mcqOptions: Record<string, string> = { a: "", b: "", c: "", d: "" };
  let currentOptLetter = ""; 

  const finalizeQuestion = () => {
    if (!currentQ || !currentQ.questionText) return;
    
    // Normalize question type aliases
    const typeAliases: Record<string, string> = {
      "true/false": "truefalse", "tf": "truefalse", "true false": "truefalse", "truefalse": "truefalse",
      "mcq": "mcq", "multiple choice": "mcq",
      "fill": "fill", "fill in the blank": "fill", "fill in the blanks": "fill", "blank": "fill", "short": "fill", "one word": "fill", "short answer": "fill",
      "jumbled": "jumbled", "jumble": "jumbled", "unscramble": "jumbled",
      "match": "match", "match the following": "match"
    };
    
    currentQ.questionType = typeAliases[currentQ.questionType] || currentQ.questionType;
    const type = currentQ.questionType;
    
    if (type === "mcq") {
      currentQ.options = mcqOptions as unknown as Prisma.JsonValue;
      currentQ.correctAnswer = answerLines[0]?.toLowerCase() || "";
    } else if (type === "jumbled") {
      const fullAnswer = answerLines.join(" ").trim();
      currentQ.correctAnswer = fullAnswer;
      const tokens = fullAnswer.includes(" ") ? fullAnswer.split(" ").filter(t => t) : fullAnswer.split("").filter(t => t);
      currentQ.options = { 
        tokens: tokens.map(value => ({ value, sort: Math.random() }))
                 .sort((a, b) => a.sort - b.sort)
                 .map(({ value }) => value)
      } as unknown as Prisma.JsonValue;
    } else if (type === "match") {
      let rawPairs = answerLines.map(s => s.trim()).filter(s => s.includes(":"));
      
      // Fallback if user comma-separated them on one line
      if (rawPairs.length <= 1 && answerLines[0]?.includes(",")) {
        rawPairs = answerLines[0].split(",").map(s => s.trim()).filter(s => s.includes(":"));
      }

      currentQ.correctAnswer = rawPairs.join("|");
      currentQ.options = {
        left: rawPairs.map(p => p.split(":")[0].trim()),
        right: rawPairs.map(p => {
          const parts = p.split(":");
          return parts.slice(1).join(":").trim();
        }).map(value => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value)
      } as unknown as Prisma.JsonValue;
    } else {
      currentQ.correctAnswer = answerLines.join(" ").trim().toLowerCase();
      currentQ.options = null;
    }
    
    questions.push(currentQ);
  };

  for (const rawLine of lines) {
    // Strip common leading list numbering that mammoth might leave behind for Questions
    const line = rawLine; 
    
    if (/^(?:\d+\.*[\s\-\)]*)?(q|question)\s*[:：]/i.test(line)) {
      if (currentQ) finalizeQuestion();
      currentQ = { 
        testId, 
        questionText: line.replace(/^(?:\d+\.*[\s\-\)]*)?(q|question)\s*[:：]/i, "").trim(), 
        questionType: "mcq", 
        marks: 1, 
        correctAnswer: "", 
        options: null 
      };
      mode = "none";
      answerLines = [];
      mcqOptions = { a: "", b: "", c: "", d: "" };
      currentOptLetter = "";
    } else if (!currentQ) {
      continue; // Ignore intro text before the first Question: appears
    } else if (/^(?:\*\s*|\-\s*|•\s*)?type\s*[:：]/i.test(line)) {
      currentQ.questionType = line.replace(/^(?:\*\s*|\-\s*|•\s*)?type\s*[:：]/i, "").trim().toLowerCase();
      mode = "none";
    } else if (/^(?:\*\s*|\-\s*|•\s*)?marks\s*[:：]/i.test(line)) {
      const marksStr = line.replace(/^(?:\*\s*|\-\s*|•\s*)?marks\s*[:：]/i, "").trim();
      currentQ.marks = parseInt(marksStr) || 1;
      mode = "none";
    } else if (/^(?:\*\s*|\-\s*|•\s*)?options\s*[:：]/i.test(line)) {
      mode = "options";
    } else if (/^(?:\*\s*|\-\s*|•\s*)?answer\s*[:：]/i.test(line)) {
      const ans = line.replace(/^(?:\*\s*|\-\s*|•\s*)?answer\s*[:：]/i, "").trim();
      if (ans) answerLines.push(ans);
      mode = "answer";
    } else if (/^(?:[a-d])[\)\.]/i.test(line)) {
      // Option literally passed as "A) Something"
      const match = line.match(/^([a-d])[\)\.]\s*(.*)/i);
      if (match) {
        currentOptLetter = match[1].toLowerCase();
        mcqOptions[currentOptLetter] = match[2].trim();
      }
    } else if (mode === "answer") {
      answerLines.push(line);
    } else if (mode === "options") {
      // Handle mammoth stripping out Auto-bullets for options
      if (!mcqOptions.a) { mcqOptions.a = line; currentOptLetter = "a"; }
      else if (!mcqOptions.b) { mcqOptions.b = line; currentOptLetter = "b"; }
      else if (!mcqOptions.c) { mcqOptions.c = line; currentOptLetter = "c"; }
      else if (!mcqOptions.d) { mcqOptions.d = line; currentOptLetter = "d"; }
      else if (currentOptLetter) {
        mcqOptions[currentOptLetter] += " " + line; // Multi-line option text
      }
    } else if (mode === "none") {
      // Append text to the questionText itself
      currentQ.questionText += "\n" + line;
    }
  }

  if (currentQ) finalizeQuestion();
  
  return questions;
}


