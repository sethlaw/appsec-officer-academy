import { academyConfig } from "./config.js";
import { cityDefenseOutcome } from "./defense.js";
import { installIdleReset } from "./idle-reset.js";
import { gradeAssessment, qualifiesForCtf, questions } from "./questions.js";
import { recordActivity, resetActivityIdentity } from "./tracker.js";

const main = document.querySelector("#main");
const toast = document.querySelector("#toast");
const emptyState = () => ({ answers: {}, currentQuestion: 1, submitted: false, result: null });
let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(academyConfig.storageKey));
    if (!saved || typeof saved !== "object") return emptyState();
    const answers = {};
    for (const question of questions) {
      const allowed = new Set(question.choices.map((choice) => choice.id));
      const selected = Array.isArray(saved.answers?.[question.id])
        ? [...new Set(saved.answers[question.id].filter((id) => allowed.has(id)))]
        : [];
      if (selected.length) answers[question.id] = question.mode === "single" ? selected.slice(0, 1) : selected;
    }
    const currentQuestion = Number.isInteger(saved.currentQuestion) && saved.currentQuestion >= 1 && saved.currentQuestion <= questions.length
      ? saved.currentQuestion
      : 1;
    const submitted = saved.submitted === true && answeredCount(answers) === questions.length;
    return { answers, currentQuestion, submitted, result: submitted ? gradeAssessment(answers) : null };
  } catch {
    return emptyState();
  }
}

function saveState() {
  sessionStorage.setItem(academyConfig.storageKey, JSON.stringify(state));
}

function answeredCount(answers = state.answers) {
  return questions.filter((question) => Array.isArray(answers[question.id]) && answers[question.id].length > 0).length;
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function applyTheme() {
  const root = document.documentElement;
  const names = { ink: "ink", panel: "panel", panelBright: "panel-bright", cyan: "cyan", teal: "teal", amber: "amber", coral: "coral", paper: "paper", muted: "muted" };
  Object.entries(academyConfig.theme).forEach(([key, value]) => root.style.setProperty(`--${names[key]}`, value));
  document.querySelector("#academy-name").textContent = academyConfig.academy;
  document.querySelector("#event-name").textContent = academyConfig.event;
  document.querySelector("#brand-logo").src = academyConfig.assets.logo;
}

// Community QR codes are black on white, so each sits in its own white frame with a quiet
// zone that phones can scan against the dark theme. The plain URL stays visible for anyone
// who would rather type it; no link, because a new tab is a dead end on a kiosk.
function qrTile(link, className = "") {
  return `<figure class="qr-tile${className ? ` ${className}` : ""}"><span class="qr-frame"><img src="${escapeHtml(link.image)}" alt="${escapeHtml(`QR code: ${link.label}`)}" width="160" height="160"></span><figcaption><strong>${escapeHtml(link.label)}</strong>${link.note ? `<p>${escapeHtml(link.note)}</p>` : ""}<small>${escapeHtml(link.url)}</small></figcaption></figure>`;
}

function homeTemplate() {
  const answered = answeredCount();
  const destination = state.submitted ? "#/results" : `#/assessment/question/${state.currentQuestion}`;
  const label = state.submitted ? "Review results" : answered ? "Resume assessment" : "Begin assessment";
  return `<section class="hero officer-hero"><div class="hero-copy">
    <p class="eyebrow">${academyConfig.event} // ${academyConfig.program}</p>
    <h1>Communication <span>Officer.</span></h1>
    <p class="lede">Test your knowledge of OWASP, the Wasatch AppSec community, and the people and ideas that keep application security moving forward.</p>
    <a class="button" href="${destination}">${label} &rarr;</a>
    <div class="mission-brief"><span><strong>10</strong><br>Questions</span><span><strong>~5</strong><br>Minutes</span><span><strong>${answered}/10</strong><br>Answered</span></div>
  </div></section>
  <section class="curriculum" id="curriculum"><div class="section-heading"><div><p class="eyebrow">Officer qualification</p><h2>Know the community.<br>Share the mission.</h2></div><div class="curriculum-intro"><p>Choose one answer unless a question says to select all that apply. Your responses remain available for this browser tab.</p><img src="${academyConfig.assets.recruitmentPoster}" alt="AppSec Needs You recruitment poster featuring the AppSec cadet figure"></div></div>
    <div class="officer-overview"><article class="mission-card" data-glyph="10"><span class="mission-number">Assessment // ${answered}/10 answered</span><h3>Communication Officer Briefing</h3><span class="skill-tag">OWASP and Wasatch AppSec</span><p>Complete all ten questions, review your selections, then submit to see your session score and answer breakdown.</p><a class="button" href="${destination}">${label}</a></article><div class="overview-copy"><p class="eyebrow">Assessment protocol</p><h2>One focused session.</h2><p>Move freely between questions before submitting. Multi-select questions use exact-set scoring, and every question is worth one point.</p><div class="protocol-list"><span>Responses saved as you work</span><span>Review before final submission</span><span>Detailed results for every question</span></div></div></div>
  </section>
  <section class="community-links" aria-labelledby="community-title"><div class="community-heading"><p class="eyebrow">Community channels</p><h2 id="community-title">Keep the signal going.</h2></div><div class="community-row">${qrTile(academyConfig.community.slack)}${qrTile(academyConfig.community.proBono, "pro-bono-tile")}</div></section>
  <section class="academy-ranks" aria-labelledby="academy-ranks-title"><div class="ranks-copy"><p class="eyebrow">Your academy path</p><h2 id="academy-ranks-title">Step into the<br>officer ranks.</h2><p>Communication Officers connect practitioners with the community, its resources, and opportunities to learn together.</p></div><img src="${academyConfig.assets.rankPoster}" alt="AppSec Academy ranks including Communication Officers for AppSec professionals"></section>`;
}

function progressDots(activeId) {
  return questions.map((question) => {
    const classes = ["progress-dot"];
    if (question.id === activeId) classes.push("active");
    if (state.answers[question.id]?.length) classes.push("complete");
    return `<a class="${classes.join(" ")}" href="#/assessment/question/${question.id}" aria-label="Question ${question.id}${state.answers[question.id]?.length ? ", answered" : ""}" title="Question ${question.id}"></a>`;
  }).join("");
}

function assessmentShell(question, content) {
  return `<section class="mission-shell"><nav class="mission-nav"><a class="back-link" href="#/">&larr; Academy deck</a><div class="progress-dots" aria-label="Assessment progress">${progressDots(question.id)}</div></nav>
    <header class="mission-header"><div><p class="eyebrow">Question ${String(question.id).padStart(2, "0")} // ${question.mode === "multiple" ? "Select all that apply" : "Choose one"}</p><h1>Officer <span>Briefing.</span></h1><div class="mission-objective"><span>Prompt</span><p>${escapeHtml(question.prompt)}</p></div></div><span class="classification">Officer clearance</span></header>${content}</section>`;
}

function choiceTemplate(question, choice) {
  const checked = state.answers[question.id]?.includes(choice.id) ? " checked" : "";
  const link = choice.href ? `<a class="choice-link" href="${choice.href}" target="_blank" rel="noopener noreferrer">Open Slack invitation</a>` : "";
  return `<label class="patch answer-choice"><input type="${question.mode === "multiple" ? "checkbox" : "radio"}" name="answer" value="${choice.id}"${checked}><span class="patch-content"><span class="choice-letter">${choice.id}</span><span class="patch-title">${escapeHtml(choice.label)}</span>${link}</span></label>`;
}

function questionTemplate(question) {
  const answered = answeredCount();
  const previous = question.id > 1 ? `#/assessment/question/${question.id - 1}` : "#/";
  const next = question.id < questions.length ? `#/assessment/question/${question.id + 1}` : "#/review";
  return assessmentShell(question, `<div class="workspace assessment-workspace"><section class="console"><div class="console-bar"><span>Response terminal // item ${question.id} of ${questions.length}</span><span class="console-lights"><i></i><i></i><i></i></span></div><div class="console-body question-console"><form id="question-form"><fieldset><legend class="sr-only">${escapeHtml(question.prompt)}</legend><p class="answer-instruction">${question.mode === "multiple" ? "Select all that apply." : "Choose one answer."}</p><div class="patches">${question.choices.map((choice) => choiceTemplate(question, choice)).join("")}</div></fieldset></form></div></section>
    <aside class="repair-panel response-panel"><span class="step-label">Response log</span><h2>${answered} of ${questions.length} answered</h2><p>Your selection is saved in this tab as soon as you make it. You can revise any response before final submission.</p><div class="question-map">${questions.map((item) => `<a href="#/assessment/question/${item.id}" class="${item.id === question.id ? "active" : ""} ${state.answers[item.id]?.length ? "answered" : ""}">${item.id}<span>${state.answers[item.id]?.length ? "Answered" : "Open"}</span></a>`).join("")}</div><div class="actions question-actions"><a class="button secondary" href="${previous}">&larr; Back</a><a class="button" href="${next}">${question.id === questions.length ? "Review" : "Next"} &rarr;</a></div></aside></div>`);
}

function bindQuestion(question) {
  document.querySelectorAll('input[name="answer"]').forEach((input) => input.addEventListener("change", () => {
    if (question.mode === "single") {
      state.answers[question.id] = [input.value];
    } else {
      state.answers[question.id] = [...document.querySelectorAll('input[name="answer"]:checked')].map((item) => item.value);
      if (!state.answers[question.id].length) delete state.answers[question.id];
    }
    state.currentQuestion = question.id;
    state.submitted = false;
    state.result = null;
    saveState();
    if (state.answers[question.id]?.length) recordActivity("officer", `question-${String(question.id).padStart(2, "0")}`, "completed");
    main.innerHTML = questionTemplate(question);
    bindQuestion(question);
    document.querySelector(`input[value="${input.value}"]`)?.focus();
  }));
}

function reviewTemplate() {
  const answered = answeredCount();
  const complete = answered === questions.length;
  return `<section class="mission-shell review-shell"><nav class="mission-nav"><a class="back-link" href="#/assessment/question/${state.currentQuestion}">&larr; Return to questions</a><div class="progress-dots" aria-label="Assessment progress">${progressDots(0)}</div></nav><header class="mission-header"><div><p class="eyebrow">Final check // ${answered} of ${questions.length} answered</p><h1>Review <span>Responses.</span></h1><p>Inspect each response before submitting the assessment. Results are calculated only after every question is answered.</p></div><span class="classification">Officer clearance</span></header>
    <div class="review-layout"><section class="review-list" aria-label="Response review">${questions.map((question) => {
      const selected = state.answers[question.id] || [];
      const labels = selected.map((id) => question.choices.find((choice) => choice.id === id)?.label).filter(Boolean);
      return `<article class="review-row ${labels.length ? "answered" : "unanswered"}"><span class="review-number">${String(question.id).padStart(2, "0")}</span><div><h2>${escapeHtml(question.prompt)}</h2><p>${labels.length ? labels.map(escapeHtml).join("; ") : "No response selected"}</p></div><a class="button secondary" href="#/assessment/question/${question.id}">Edit</a></article>`;
    }).join("")}</section><aside class="submit-panel"><span class="step-label">Submission status</span><strong>${complete ? "Ready for scoring" : `${questions.length - answered} remaining`}</strong><p>${complete ? "Submitting locks this result for the current session. You can still review every answer afterward." : "Answer every question before submitting your assessment."}</p><button class="button" id="submit-assessment" type="button" ${complete ? "" : "disabled"}>Submit assessment</button></aside></div></section>`;
}

function bindReview() {
  document.querySelector("#submit-assessment")?.addEventListener("click", () => {
    if (answeredCount() !== questions.length) return;
    state.submitted = true;
    state.result = gradeAssessment(state.answers);
    saveState();
    window.location.hash = "#/results";
  });
}

function answerLabels(question, ids) {
  return ids.map((id) => question.choices.find((choice) => choice.id === id)?.label).filter(Boolean).map(escapeHtml).join("; ");
}

function cityDefenseTemplate(score, total) {
  const outcome = cityDefenseOutcome(score, total);
  const stateClass = outcome.protected ? "protected" : "destroyed";
  const headline = outcome.protected ? "The shield holds." : "Defenses breached.";
  const summary = outcome.protected
    ? "Your communication network identified every threat in time. Interceptors destroy the incoming missiles before they reach the city."
    : "Critical signals were missed. The defense grid reacts too late, and incoming missiles reach the city.";
  const label = outcome.protected ? "City protected" : "City destroyed";
  const aria = outcome.protected
    ? `City defense simulation. Score ${outcome.percent} percent. A shield intercepts three incoming missiles and the city remains protected.`
    : `City defense simulation. Score ${outcome.percent} percent. Three incoming missiles pass the disabled shield and destroy the city.`;

  return `<section class="city-defense ${stateClass} running" aria-labelledby="city-defense-title">
    <div class="defense-brief">
      <p class="eyebrow">Final scenario // city defense network</p>
      <h2 id="city-defense-title">${headline}</h2>
      <p>${summary}</p>
      <div class="defense-score"><span>Officer score</span><strong>${outcome.percent}%</strong><small>Protection requires greater than ${outcome.threshold}%</small></div>
      <div class="defense-verdict"><i aria-hidden="true"></i><span>${label}</span></div>
      <button class="button secondary replay-defense" id="replay-defense" type="button">Replay simulation</button>
    </div>
    <div class="defense-stage" role="img" aria-label="${aria}">
      <div class="defense-stars" aria-hidden="true"></div>
      <div class="defense-grid" aria-hidden="true"></div>
      <div class="defense-moon" aria-hidden="true"></div>
      <span class="incoming-missile missile-one" aria-hidden="true"><i></i></span>
      <span class="incoming-missile missile-two" aria-hidden="true"><i></i></span>
      <span class="incoming-missile missile-three" aria-hidden="true"><i></i></span>
      <div class="defense-shield" aria-hidden="true"><i></i></div>
      <span class="impact impact-one" aria-hidden="true"></span>
      <span class="impact impact-two" aria-hidden="true"></span>
      <span class="impact impact-three" aria-hidden="true"></span>
      <div class="city-smoke smoke-one" aria-hidden="true"></div>
      <div class="city-smoke smoke-two" aria-hidden="true"></div>
      <div class="city-skyline" aria-hidden="true">
        <i class="building b1"></i><i class="building b2"></i><i class="building b3"></i><i class="building b4"></i><i class="building b5"></i><i class="building b6"></i><i class="building b7"></i><i class="building b8"></i>
      </div>
      <div class="defense-ground" aria-hidden="true"></div>
      <div class="defense-terminal"><span>COMMUNICATION GRID</span><strong>${outcome.protected ? "THREATS INTERCEPTED" : "SIGNAL LOST"}</strong></div>
    </div>
  </section>`;
}

function replayCityDefense() {
  const scene = document.querySelector(".city-defense");
  if (!scene) return;
  scene.classList.remove("running");
  void scene.offsetWidth;
  scene.classList.add("running");
}

function resultsTemplate() {
  const result = state.result || gradeAssessment(state.answers);
  const percent = Math.round((result.score / result.total) * 100);
  const qualified = qualifiesForCtf(result.score, result.total, academyConfig.ctfMinimumPercent);
  const ctfAward = qualified ? `<div class="ctf-award officer-ctf-award"><span>Hackers Challenge CTF token // ${academyConfig.ctfMinimumPercent}% qualification confirmed</span><code id="ctf-token">${academyConfig.ctfToken}</code><button class="button" id="copy-token" type="button">Copy token</button></div>` : "";
  return `<section class="results">${cityDefenseTemplate(result.score, result.total)}<header class="results-hero"><img class="completion-logo" src="${academyConfig.assets.logo}" alt="OWASP space logo"><p class="eyebrow">Assessment complete</p><h1>Session <span>Results.</span></h1><div class="score-orbit"><strong>${result.score}</strong><span>of ${result.total}<br>${percent}%</span></div><p>${qualified ? "Communication Officer qualification confirmed. Your Hackers Challenge token is ready." : `Your assessment has been scored. Earn ${academyConfig.ctfMinimumPercent}% or better to reveal the Hackers Challenge token.`}</p>${ctfAward}${qrTile(academyConfig.community.meetup, "results-meetup")}<div class="actions results-actions"><a class="button" href="#results-detail">Review responses</a><button class="button secondary" id="new-session" type="button">Start new session</button></div></header>
    <section class="result-detail" id="results-detail"><div class="section-heading"><div><p class="eyebrow">Answer ledger</p><h2>Question by question.</h2></div><p>Multi-select questions require every correct option and no incorrect options.</p></div>${questions.map((question) => {
      const item = result.results.find((entry) => entry.id === question.id);
      return `<article class="result-row ${item.correct ? "correct" : "incorrect"}"><div class="result-status"><span>${item.correct ? "Correct" : "Incorrect"}</span><strong>${String(question.id).padStart(2, "0")}</strong></div><div><h3>${escapeHtml(question.prompt)}</h3><p><b>Your response:</b> ${answerLabels(question, item.selectedIds)}</p>${item.correct ? "" : `<p><b>Correct response:</b> ${answerLabels(question, question.correctIds)}</p>`}</div></article>`;
    }).join("")}</section></section>`;
}

async function copyCtfToken() {
  try {
    await navigator.clipboard.writeText(academyConfig.ctfToken);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#ctf-token"));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
    selection.removeAllRanges();
  }
  document.querySelector("#copy-token").textContent = "Copied!";
  notify("CTF token copied.");
}

function clearParticipantSession() {
  state = emptyState();
  sessionStorage.removeItem(academyConfig.storageKey);
  resetActivityIdentity();
}

function resetSession(confirmReset = true) {
  if (confirmReset && answeredCount() > 0 && !window.confirm("Start a new assessment and clear this session's responses?")) return;
  clearParticipantSession();
  window.location.hash = "#/";
  window.location.reload();
}

function returnToCommunity(event) {
  event.preventDefault();
  clearParticipantSession();
  window.location.assign("/");
}

function route() {
  const path = window.location.hash || "#/";
  if (path === "#/review") {
    main.innerHTML = reviewTemplate();
    bindReview();
  } else if (path === "#/results") {
    if (!state.submitted || !state.result) {
      window.location.hash = "#/review";
      return;
    }
    main.innerHTML = resultsTemplate();
    document.querySelector("#new-session").addEventListener("click", () => resetSession(false));
    document.querySelector("#copy-token")?.addEventListener("click", copyCtfToken);
    document.querySelector("#replay-defense")?.addEventListener("click", replayCityDefense);
  } else if (path.startsWith("#/assessment/question/")) {
    const id = Number(path.split("/").pop());
    const question = questions.find((item) => item.id === id);
    if (!question || state.submitted) {
      window.location.hash = state.submitted ? "#/results" : "#/";
      return;
    }
    state.currentQuestion = id;
    saveState();
    main.innerHTML = questionTemplate(question);
    bindQuestion(question);
    recordActivity("officer", `question-${String(question.id).padStart(2, "0")}`, "started");
  } else {
    main.innerHTML = homeTemplate();
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.querySelector("#reset-progress").addEventListener("click", () => resetSession(true));
document.querySelector(".brand").addEventListener("click", returnToCommunity);
window.addEventListener("hashchange", route);
applyTheme();
route();
installIdleReset(() => resetSession(false));
