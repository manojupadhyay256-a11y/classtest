import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Map of current correct answers (lowercase) to additional acceptable alternatives
// Only adding genuinely correct alternative phrasings, NOT wrong answers
const alternativesMap: Record<string, string[]> = {
  // Computer basics
  "machine": ["machine language", "machine code"],
  "second": ["2nd", "2"],
  "object": ["object code"],
  "interpreter": ["an interpreter"],
  "program": ["a program"],
  "source code": ["source", "source program"],
  
  // Word processing
  "synonyms": ["synonym"],
  "data": ["data source"],
  "f7": ["F7"],
  "thesaurus": ["the thesaurus"],
  "proofing": ["proofing group"],
  "common": ["common content"],
  "start mail merge": ["start mail merge button", "mail merge"],
  "insert": ["insert button"],
  
  // Number systems
  "binary": ["binary number system", "binary system"],
  "carry": ["a carry", "carry over"],
  "base": ["base number", "radix"],
  "arithmetic": ["computer arithmetic"],
  
  // Networking  
  "network": ["networking", "computer network"],
  "servers": ["server"],
  "extranet": ["extra net", "extra-net"],
  "topology": ["network topology"],
  "ring": ["ring topology"],
  "network interface": ["NIC", "network interface card", "nic card", "nic"],
  "bluetooth": ["blue tooth", "blue-tooth"],
  "mesh": ["mesh topology"],
  
  // ICT
  "management": ["management system"],
  "communication": ["communication technology", "communications"],
  "barcode": ["bar code", "bar-code"],
  "web": ["web based", "web-based"],
  "design": ["designing"],
  "pin": ["PIN number", "pin number"],
  "gross": ["gross settlement"],
  "e-governance": ["egovernance", "e governance", "e-government"],
  "resonance": ["resonance imaging"],
  "computerised": ["computerized", "computer"],
  "glucose": ["glucose level", "sugar", "sugar level"],
  
  // Spelling
  "green": ["green line", "green wavy line"],
  "contextual": ["contextual error"],
}

async function main() {
  console.log("=== STEP 1: Updating correct answers with alternatives ===\n")
  
  let questionsUpdated = 0
  
  for (const [currentAnswer, alternatives] of Object.entries(alternativesMap)) {
    // Find all questions with this exact correct answer (case-insensitive)
    const questions = await prisma.question.findMany({
      where: {
        questionType: { in: ['fill', 'short'] },
        correctAnswer: { equals: currentAnswer, mode: 'insensitive' }
      }
    })
    
    for (const q of questions) {
      // Check if alternatives are already added
      const existing = q.correctAnswer.trim()
      const existingParts = existing.split(',').map(s => s.trim().toLowerCase())
      
      // Only add alternatives that aren't already there
      const newAlternatives = alternatives.filter(
        alt => !existingParts.includes(alt.toLowerCase())
      )
      
      if (newAlternatives.length > 0) {
        const newCorrectAnswer = [existing, ...newAlternatives].join(', ')
        
        await prisma.question.update({
          where: { id: q.id },
          data: { correctAnswer: newCorrectAnswer }
        })
        
        console.log(`Updated Q: "${q.questionText.substring(0, 60)}..."`)
        console.log(`  Old: "${existing}"`)
        console.log(`  New: "${newCorrectAnswer}"`)
        console.log()
        questionsUpdated++
      }
    }
  }
  
  console.log(`\nUpdated ${questionsUpdated} questions with alternatives.\n`)
  
  // ===== STEP 2: REGRADE ALL RESULTS =====
  console.log("=== STEP 2: Regrading all results ===\n")
  
  const results = await prisma.result.findMany({
    include: {
      student: true,
      test: {
        include: {
          questions: true
        }
      }
    }
  })
  
  let scoresUpdated = 0
  
  for (const result of results) {
    const answers = result.answers as Record<string, string>
    if (!answers || typeof answers !== 'object') continue
    
    let newScore = 0
    
    for (const question of result.test.questions) {
      if (!answers[question.id]) continue
      
      const studentAnswer = answers[question.id].toString().trim()
      const correctAnswer = question.correctAnswer.trim()
      let isCorrect = false
      
      if (question.questionType === "match") {
        const studentPairs = studentAnswer.split("|")
          .map((p: string) => p.trim().toLowerCase())
          .filter(Boolean)
          .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
          .sort()

        const correctPairs = correctAnswer.split("|")
          .map((p: string) => p.trim().toLowerCase())
          .filter(Boolean)
          .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
          .sort()

        isCorrect = studentPairs.length === correctPairs.length && 
                    studentPairs.every((p: string, i: number) => p === correctPairs[i])
      } else if (question.questionType === "jumbled") {
        isCorrect = studentAnswer.toLowerCase().replace(/\s+/g, "") === correctAnswer.toLowerCase().replace(/\s+/g, "")
      } else if (question.questionType === "fill" || question.questionType === "short") {
        const validAnswers = correctAnswer.split(",").map((a: string) => a.trim().toLowerCase())
        isCorrect = validAnswers.includes(studentAnswer.toLowerCase())
      } else {
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }
      
      if (isCorrect) {
        newScore += Number(question.marks)
      }
    }
    
    if (newScore !== result.score) {
      console.log(`${result.student.name}: Score ${result.score} → ${newScore} (${newScore > result.score ? '+' : ''}${newScore - result.score})`)
      
      await prisma.result.update({
        where: { id: result.id },
        data: { score: newScore }
      })
      scoresUpdated++
    }
  }
  
  console.log(`\n=== DONE ===`)
  console.log(`Questions updated with alternatives: ${questionsUpdated}`)
  console.log(`Student scores updated: ${scoresUpdated}`)
}

main().finally(async () => { await prisma.$disconnect() })
