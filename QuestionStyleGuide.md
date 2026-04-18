# 📝 Question Creation Style Guide

Follow these formatting rules when creating questions to ensure the auto-grading system works perfectly and fairly for all students.

---

## 💡 General Rules (Applies to ALL types)

*   **Case Insensitive:** The system ignores capitalization. `Computer`, `COMPUTER`, and `computer` are all treated the same.
*   **Automatic Trimming:** Leading and trailing spaces are automatically removed from student answers.

---

## 1️⃣ Fill in the Blanks & Short Answers
**System Feature:** Supports multiple correct alternatives.

If a question has more than one way to be answered correctly (e.g., an abbreviation or a synonym), separate them with a **comma (`,`)**.

*   **Correct Answer Format:** `Primary Answer, Alternative 1, Alternative 2`
*   **Example 1:** `NIC, Network Interface Card, Network Card`
*   **Example 2:** `2nd, second, two`
*   **Example 3:** `Monitor, VDU, Visual Display Unit`

> [!TIP]
> Always include the most common variations to reduce your manual grading load.

---

## 2️⃣ Jumbled Words
**System Feature:** Ignores internal spaces.

Students often type jumbled words with spaces between letters (e.g., `C O M P U T E R`). The system now automatically removes these spaces before checking.

*   **Correct Answer Format:** Just type the correct word normally.
*   **Example:** `SOFTWARE`
*   **Will Match:** `software`, `SOFTWARE`, `s o f t w a r e`, `S O F T W A R E`

---

## 3️⃣ Match the Following
**System Feature:** Position-independent and space-flexible.

Use the `Key:Value` format separated by a `|` (pipe) symbol.

*   **Correct Answer Format:** `Item1:Match1 | Item2:Match2 | Item3:Match3`
*   **Example:** `CPU:Brain | Monitor:Display | Mouse:Input Device`

> [!IMPORTANT]
> Ensure students know they must use the `:` and `|` symbols exactly as shown in your instructions if they are typing the answer manually.

---

## 4️⃣ MCQ & True/False
**System Feature:** Exact match (case-insensitive).

The "Correct Answer" must exactly match one of the options provided.

*   **MCQ Correct Answer:** `Option B` (if your options are Option A, Option B, etc.)
*   **True/False Correct Answer:** `True` or `False`

---

## 🚀 Pro-Tips for "No-Stress" Exams

1.  **Clear Instructions:** Briefly tell students: *"For Match the Following, use the format A:1 | B:2"*.
2.  **Avoid Punctuation:** Unless it's part of the word, avoid ending your "Correct Answer" with a period (.), as students might not type it. 
    *   *Bad:* `Operating System.`
    *   *Good:* `Operating System`
3.  **Use Alternatives:** When in doubt, add it as a comma-separated alternative!
