const text = `
Type: mcq

A) 1992

B) 2002

C) 1952

D) 1982

Answer: C

Question: ______ language is the only language that a computer directly understands.

Type: fill

Answer: Machine

Question: Assembly language is regarded as the ______ generation language.

Type: fill

Answer: second
`;

function parseQuestions(text, testId) {
  let normalizedText = text.replace(/\s+:/g, ':');
  // NOTE: In JS, $2 in replace means the second capture group.
  normalizedText = normalizedText.replace(/(\s+)(Question:|Type:|Marks:|Options:|Answer:)/gi, '\n$2');
  const blocks = ('\n' + normalizedText).split(/\n\s*(?=question:|q:)/i).filter(b => b.trim());
  const questions = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const currentQuestion = { questionText: '', questionType: 'mcq' };
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('q:') || lowerLine.startsWith('question:')) {
        currentQuestion.questionText = line.replace(/^(q|question):/i, '').trim();
      } else if (lowerLine.startsWith('type:')) {
        currentQuestion.questionType = line.replace(/^type:/i, '').trim().toLowerCase();
      }
    }
    questions.push(currentQuestion);
  }
  return questions;
}

console.log(JSON.stringify(parseQuestions(text, 't1'), null, 2));
