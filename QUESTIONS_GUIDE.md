# 📝 Questions Creation Guide

Follow this guide to ensure all question types are properly visible and functional in your tests.

## 1. Multiple Choice (MCQ)
*   **Question Text:** Enter your question prompt.
*   **Options:** Fill in the text for options **A, B, C, and D**.
*   **Correct Answer:** Select the **radio button** next to the correct option before saving.

## 2. True / False
*   **Question Text:** Enter the statement (e.g., *"The Earth is flat."*).
*   **Correct Answer:** Select either the **TRUE** or **FALSE** button. Highlighting the button sets it as the correct answer.

## 3. Fill in the Blank
*   **Question Text:** Enter the sentence, using underscores for the blank (e.g., *"The capital of India is ________."*).
*   **Correct Answer:** Type the **exact word** or phrase that completes the blank (e.g., *"New Delhi"*).

## 4. Jumbled Word / Sentence
*   **Question Text:** Give instructions (e.g., *"Rearrange to form a correct sentence"*).
*   **Correct Answer:** Type the **Full Correct Sentence** (e.g., *"The quick brown fox"*).
    *   **System Action:** The system automatically splits your answer by **spaces** into tiles and shuffles them for the student.

## 5. Match the Following
*   **Question Text:** Enter instructions (e.g., *"Match the following countries with their capitals"*).
*   **Match Pairs:** Enter your pairs in the format `Left:Right`, one pair per line.
    *   **Example:**
        ```text
        France:Paris
        Japan:Tokyo
        India:Delhi
        ```
    *   **System Action:** The left side items are fixed, and the right side items are shuffled for the student to match.

## 6. Short Answer
*   **Question Text:** Enter the question.
*   **Correct Answer:** Enter the model answer for reference.

---

### 💡 General Tips
- **Marks:** Always assign a marks value to each question.
- **Bulk Import:** You can use the **"Bulk Import (.docx)"** button to upload multiple questions at once using these same formats.
- **Order:** Questions are displayed to students in the order you create them.
