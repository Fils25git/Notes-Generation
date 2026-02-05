const API_KEY = "AIzaSyCJkAD5a7rEb_TL6cd7KuSR2aQIvYFlB7k";

async function generate() {
  const title = document.getElementById("prompt").value;
  const output = document.getElementById("output");

  output.textContent = "Generating...";

  // 🔴 THIS IS THE HIDDEN PROMPT (your rules)
  const fullPrompt = `
You are a professional Rwandan CBC teacher(To mean you have to refer to rwanda curriculumn, books, and syllabus from differents Sites of government).

The user will only provide the LESSON TITLE.
You must generate full classroom notes automatically.

STRICT RULES:
- Do NOT ask questions
- Do NOT explain what you are doing
- Do NOT talk to the user
- Directly write teaching notes
- Write long, detailed content
- Use simple English suitable for primary students

FORMAT:

LESSON TITLE: ${title}

1. Introduction
(Short engaging introduction for learners)

2. Objectives
(2 or 3 learning objectives)

3. Key Vocabulary
(Important terms with meanings)

4. Lesson Content / Notes
(Very detailed explanation — many paragraphs)

5. Examples
(Real life examples)

6. Classroom Activities
(Teacher + learner activities)

7. Assessment Questions
(Questions to ask learners)

8. Homework
(Simple exercise)

Write as a real teacher preparing notes, not as AI.
`;
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
  contents: [
    {
      parts: [{ text: fullPrompt }]
    }
  ],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048
  }
})
            }
          ]
        })
      }
    );

    const data = await response.json();
    output.textContent =
      data.candidates[0].content.parts[0].text;

  } catch (error) {
    output.textContent = "Error: " + error.message;
  }
}
