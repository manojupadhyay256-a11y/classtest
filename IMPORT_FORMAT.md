# 📑 Word Import Format Guide

Copy and paste these formats into your Word document (`.docx`) to bulk-upload questions to your test.

## ⚠️ Important Rules
1. Separate each question with at least **one blank line**.
2. **Keywords** like `Question:`, `Type:`, `Marks:`, and `Answer:` must be included. The system is smart enough to find them, but keep them clearly written.
3. For **Match** questions, use a colon (`:`) to separate the left and right items.

---

## 📋 Simple Templates

### 1. Multiple Choice (MCQ)
```text
Question: What is the capital of France?
Type: mcq
Marks: 1
Options:
A) Berlin
B) Paris
C) Madrid
D) Rome
Answer: B
```

### 2. Fill in the Blanks
```text
Question: The sky is ______ today.
Type: fill
Marks: 1
Answer: blue
```

### 3. One Word Answer / Short Answer
*(For these, you can just use the "fill" or "short" type)*
```text
Question: What planet do we live on?
Type: fill
Marks: 1
Answer: Earth
```

### 4. Jumbled Word / Sentence
*(If you give a jumbled word in the question, students will see scrambled letter tiles and an input box to write the correct word. They can tap the tiles or type the word.)*
```text
Question: Unscramble this word: ptucomer
Type: jumbled
Marks: 2
Answer: computer
```

### 5. Match the Following
*(Write pairs on a new line separated by a colon `:`)*
```text
Question: Match the following capitals.
Type: match
Marks: 3
Answer:
India : New Delhi
France : Paris
Japan : Tokyo
```
