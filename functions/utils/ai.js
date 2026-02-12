const API_KEYS = [
  process.env.GEMINI_KEY1,
  process.env.GEMINI_KEY2,
  process.env.GEMINI_KEY3,
  process.env.GEMINI_KEY4,
  process.env.GEMINI_KEY5,
].filter(Boolean);

// ---------------- GEMINI SAFE CALL ----------------
async function callGemini(prompt, maxTokens = 4000) {

  let lastError;

  for (const key of API_KEYS) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens }
          })
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const text = parts.map(p => p.text || "").join("").trim();

      if (text) return text;

    } catch (err) {
      lastError = err;
    }
  }

  throw new Error("All Gemini keys failed: " + lastError);
}

// ---------------- PLAN GENERATION ----------------
exports.generateQuizPlan = async function(data) {

const prompt = `
You are a professional Rwandan CBC teacher.

Create a QUIZ PLAN ONLY.

Level: ${data.level}
Class: ${data.classLevel}
Subject: ${data.subject}
Topic: ${data.title}

Total questions: ${data.numberOfQuestions}
Total marks: ${data.marks}

Return ONLY JSON array:
[q,type,marks]
`;

const text = await callGemini(prompt, 3000);
return JSON.parse(text);
};

// ---------------- QUESTION GENERATION ----------------
exports.generateQuestions = async function(chunk, session, startNumber) {

const prompt = `
You are a professional Rwandan CBC teacher.

Generate learner QUESTIONS ONLY.

Numbering must start from ${startNumber}

Level: ${session.level}
Class: ${session.class}
Subject: ${session.subject}
Topic: ${session.title}

PLAN:
${JSON.stringify(chunk, null, 2)}

Return ONLY HTML
`;

return await callGemini(prompt, 1500);
};
