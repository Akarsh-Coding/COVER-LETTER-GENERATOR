"use strict";

/**
 * Cover Letter Generator — Phase 1 MVP
 * Captures form state, interpolates it into a hardcoded template,
 * and renders a preview with copy-to-clipboard support.
 */

const form = document.getElementById("clForm");
const nameInput = document.getElementById("name");
const roleInput = document.getElementById("role");
const companyInput = document.getElementById("company");

const skillInput = document.getElementById("skillInput");
const skillList = document.getElementById("skillList");

const letterEl = document.getElementById("letter");
const letterWarning = document.getElementById("letterWarning");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const copyStatus = document.getElementById("copyStatus");

let skills = [];

document.getElementById("date").textContent = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
});


// Add Skill(s)
// Supports pasting/typing a comma-separated list, not just one at a time.

function addSkillsFromInput() {

    const candidates = skillInput.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    candidates.forEach((candidate) => {
        const alreadyAdded = skills.some(
            (s) => s.toLowerCase() === candidate.toLowerCase()
        );
        if (!alreadyAdded) skills.push(candidate);
    });

    skillInput.value = "";
    renderSkills();
}


// Render Skill Chips
// Built with DOM APIs (not innerHTML) so a skill like "<img onerror=...>"
// is always treated as plain text, never as markup.

function renderSkills() {

    skillList.innerHTML = "";

    skills.forEach((skill, index) => {

        const chip = document.createElement("span");
        chip.className = "skill";

        const label = document.createElement("span");
        label.textContent = skill;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "×";
        removeBtn.dataset.index = index;
        removeBtn.setAttribute("aria-label", `Remove ${skill}`);

        chip.append(label, removeBtn);
        skillList.appendChild(chip);

    });

}


// Remove Skill
// One delegated listener on the container handles every chip's button,
// including chips added after page load — no inline onclick needed.

skillList.addEventListener("click", function (e) {

    const btn = e.target.closest("button[data-index]");
    if (!btn) return;

    skills.splice(Number(btn.dataset.index), 1);
    renderSkills();

});


// Press Enter or comma to commit the current skill

skillInput.addEventListener("keydown", function (e) {

    if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addSkillsFromInput();
    } else if (e.key === "Backspace" && !skillInput.value && skills.length) {
        skills.pop();
        renderSkills();
    }

});

// Catch skills left in the box if the user clicks away without pressing Enter
skillInput.addEventListener("blur", function () {
    if (skillInput.value.trim()) addSkillsFromInput();
});


// Build Letter (offline fallback)
// Used only if the /chat request fails, so the user still gets something.

function buildLetter() {

    const name = nameInput.value.trim() || "[Your Name]";
    const role = roleInput.value.trim() || "[Job Role]";
    const company = companyInput.value.trim() || "[Company]";
    const skillText = skills.length ? skills.join(", ") : "[Skills]";

    return `Dear Hiring Manager at ${company},

I am ${name}, writing to apply for the ${role} position.

My background includes hands-on experience with ${skillText}. I believe these skills will help me contribute effectively to your organization.

I would appreciate the opportunity to discuss how I can add value to ${company}.

Sincerely,

${name}`;

}


// Generate
// Runs on form submit so the browser's native "required" validation
// fires first. Calls the server's /chat endpoint, which calls Gemini.

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    setLoadingState(true);

    try {

        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: nameInput.value.trim(),
                role: roleInput.value.trim(),
                company: companyInput.value.trim(),
                skills,
            }),
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error || `Server responded ${response.status}`);
        }

        const data = await response.json();
        letterEl.textContent = data.letter;
        letterEl.classList.remove("empty");
        copyBtn.disabled = false;
        hideWarning();

    } catch (err) {

        console.error("AI generation failed, falling back to local draft:", err);
        letterEl.textContent = buildLetter();
        letterEl.classList.remove("empty");
        copyBtn.disabled = false;
        showWarning("AI service unavailable right now — showing a local draft instead.");

    } finally {
        setLoadingState(false);
    }

});

function setLoadingState(isLoading) {

    generateBtn.disabled = isLoading;
    generateBtn.textContent = isLoading ? "Generating…" : "Generate Draft";

    if (isLoading) {
        letterEl.textContent = "Generating your cover letter…";
        letterEl.classList.add("empty");
        copyBtn.disabled = true;
        hideWarning();
    }

}

function showWarning(message) {
    letterWarning.textContent = message;
    letterWarning.hidden = false;
}

function hideWarning() {
    letterWarning.textContent = "";
    letterWarning.hidden = true;
}


// Copy

copyBtn.addEventListener("click", async function () {

    try {
        await navigator.clipboard.writeText(letterEl.textContent);
        copyStatus.textContent = "Copied ✓";
    } catch (err) {
        console.error("Clipboard write failed:", err);
        copyStatus.textContent = "Couldn't copy — select the text and copy manually.";
    }

    setTimeout(function () {
        copyStatus.textContent = "";
    }, 2000);

});