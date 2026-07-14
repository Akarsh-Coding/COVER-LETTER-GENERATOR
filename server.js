require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

if (!API_KEY) {
    console.error(
        "Missing API_KEY in .env — the /chat endpoint will return errors until it's set."
    );
}

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

app.post("/chat", async (req, res) => {

    const { name, role, company, skills } = req.body || {};

    if (!name || !role || !company) {
        return res.status(400).json({ error: "name, role, and company are required." });
    }

    const skillText =
        Array.isArray(skills) && skills.length
            ? skills.join(", ")
            : "relevant skills for the role";

    const prompt = `Write a professional, concise cover letter (3-4 short paragraphs, plain text, no markdown formatting, no placeholder brackets) for the following applicant.

Candidate name: ${name}
Job role: ${role}
Target company: ${company}
Key skills: ${skillText}

Sign off with the candidate's name. Do not include a date or address block — just the letter body.`;

    try {
        const geminiRes = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": API_KEY,
            },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            }),
        });

        const data = await geminiRes.json();

        if (!geminiRes.ok) {
            console.error("Gemini API error:", data);
            return res
                .status(502)
                .json({ error: data.error?.message || "The AI service returned an error." });
        }

        const letter = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!letter) {
            return res.status(502).json({ error: "The AI service returned an empty response." });
        }

        res.json({ letter: letter.trim() });

    } catch (err) {
        console.error("Request to Gemini failed:", err);
        res.status(500).json({ error: "Couldn't reach the AI service. Try again in a moment." });
    }

});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});