// netlify/functions/generateNotes.js
import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const { title } = JSON.parse(event.body);

    if (!title) {
      return { statusCode: 400, body: "Lesson title is required." };
    }

    const API_KEY = process.env.GEMINI_KEY; // Set this in Netlify env vars
    const MODEL = "models/gemini-2.5-flash";

    const fullPrompt = `
You are a professional Rwandan CBC teacher.
You strictly follow Rwanda CBC curriculum, syllabus, and approved learning standards.

The user will ONLY provide the lesson title.
You must generate complete classroom notes automatically.

STRICT RULES:
- Do NOT ask questions
- Do NOT explain your process
- Do NOT talk to the user
- Write long, detailed teaching notes
- Use simple English suitable for primary learners

OUTPUT FORMAT (CLEAN HTML ONLY):

<h2>LESSON TITLE: ${title}</h2>

<h3>Introduction</h3>
<p>Short engaging introduction.</p>

<h3>Objectives</h3>
<ul>
  <li>Objective 1</li>
  <li>Objective 2</li>
  <li>Objective 3</li>
</ul>

<h3>Key Vocabulary</h3>
<ul>
  <li>Word – meaning</li>
</ul>

<h3>Lesson Notes</h3>
<p>Very detailed explanation in multiple paragraphs.</p>

<h3>Examples</h3>
<ul>
  <li>Real-life example</li>
</ul>

<h3>Classroom Activities</h3>
<ul>
  <li>Teacher activity</li>
  <li>Learner activity</li>
</ul>

<h3>Assessment Questions</h3>
<ul>
  <li>Question 1</li>
</ul>

<h3>Homework</h3>
<p>Simple homework task.</p>

Do NOT use markdown.
Do NOT write explanations.
Only output the lesson notes.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
        }),
      }
    );

    const data = await response.json();

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No notes generated.";

    return {
      statusCode: 200,
      body: JSON.stringify({ notes: text }),
    };
  } catch (error) {
    return { statusCode: 500, body: "Error: " + error.message };
  }
}
