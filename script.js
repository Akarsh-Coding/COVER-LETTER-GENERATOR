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


// Build Letter

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
// fires first (e.g. tabbing to an empty Name field and showing a prompt).

form.addEventListener("submit", function (e) {

    e.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    letterEl.textContent = buildLetter();
    letterEl.classList.remove("empty");
    copyBtn.disabled = false;

});


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