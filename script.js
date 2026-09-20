// CGPA Calculator, 5.0 scale (Nigerian universities)
// State shape: { semesters: [{ id, name, courses: [{ id, name, unit, grade }] }], prior: { cgpa, units } }
// Persisted in localStorage under STORAGE_KEY.

const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
const STORAGE_KEY = "cgpa-data";
const MAX_UNIT = 10;
const MAX_PRIOR_UNITS = 400;

let state = loadState();
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function emptyState() {
  return { semesters: [], prior: { cgpa: "", units: "" } };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.semesters)) return emptyState();
    const semesters = parsed.semesters.map((s) => ({
      id: String(s.id || uid()),
      name: String(s.name || "Semester"),
      courses: Array.isArray(s.courses)
        ? s.courses.map((c) => ({
            id: String(c.id || uid()),
            name: String(c.name || ""),
            unit: clampUnit(c.unit),
            grade: Object.prototype.hasOwnProperty.call(GRADE_POINTS, c.grade) ? c.grade : "A",
          }))
        : [],
    }));
    const prior = parsed.prior && typeof parsed.prior === "object" ? parsed.prior : {};
    return { semesters, prior: { cgpa: prior.cgpa ?? "", units: prior.units ?? "" } };
  } catch (err) {
    console.error("Could not read saved data, starting fresh.", err);
    return emptyState();
  }
}

let saveTimer = null;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Could not save data.", err);
    }
  }, 250);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Unit values are always a whole number from 0 to MAX_UNIT, even if typed or stored badly.
function clampUnit(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_UNIT, Math.max(0, n));
}

function pointsFor(grade) {
  return GRADE_POINTS[grade] ?? 0;
}

// One helper for all the math. Returns quality points and units for a list of courses.
function tally(courses) {
  let points = 0;
  let units = 0;
  for (const c of courses) {
    const u = clampUnit(c.unit);
    points += u * pointsFor(c.grade);
    units += u;
  }
  return { points, units };
}

function semesterGPA(semester) {
  const { points, units } = tally(semester.courses);
  return units > 0 ? points / units : 0;
}

function priorValues() {
  const cgpa = Number(state.prior.cgpa);
  const units = Number(state.prior.units);
  const okCgpa = state.prior.cgpa !== "" && Number.isFinite(cgpa) && cgpa >= 0 && cgpa <= 5;
  const okUnits = state.prior.units !== "" && Number.isFinite(units) && units >= 0 && units <= MAX_PRIOR_UNITS;
  if (!okCgpa || !okUnits) return { points: 0, units: 0, valid: state.prior.cgpa === "" && state.prior.units === "" };
  return { points: cgpa * units, units, valid: true };
}

function overall() {
  let points = 0;
  let units = 0;
  for (const s of state.semesters) {
    const t = tally(s.courses);
    points += t.points;
    units += t.units;
  }
  const p = priorValues();
  points += p.points;
  units += p.units;
  return { cgpa: units > 0 ? points / units : 0, units, points };
}

function classOfDegree(cgpa, units) {
  if (units === 0) return "Add courses to see your class of degree";
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa > 0) return "Pass";
  return "Fail range";
}

/* Mutations */

function addSemester() {
  state.semesters.push({ id: uid(), name: "Semester " + (state.semesters.length + 1), courses: [] });
  saveState();
  renderSemesters();
  renderSummary();
}

function removeSemester(id) {
  state.semesters = state.semesters.filter((s) => s.id !== id);
  saveState();
  renderSemesters();
  renderSummary();
}

function addCourse(semesterId) {
  const s = state.semesters.find((x) => x.id === semesterId);
  if (!s) return;
  s.courses.push({ id: uid(), name: "", unit: 3, grade: "A" });
  saveState();
  renderSemesters();
  renderSummary();
}

function removeCourse(semesterId, courseId) {
  const s = state.semesters.find((x) => x.id === semesterId);
  if (!s) return;
  s.courses = s.courses.filter((c) => c.id !== courseId);
  saveState();
  renderSemesters();
  renderSummary();
}

/* Rendering. Semesters rebuild on structure changes only. Typing updates numbers in place. */

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.appendChild(c);
  return node;
}

function renderSemesters() {
  const box = $("semesters-container");
  box.textContent = "";

  if (state.semesters.length === 0) {
    box.appendChild(el("div", { class: "semester" }, [el("p", { class: "empty", text: "No semesters yet. Tap Add semester to start." })]));
    return;
  }

  const frag = document.createDocumentFragment();
  for (const s of state.semesters) frag.appendChild(renderSemester(s));
  box.appendChild(frag);
}

function renderSemester(s) {
  const gpa = el("span", { class: "gpa", id: "gpa-" + s.id, text: "GPA " + semesterGPA(s).toFixed(2) });

  const name = el("input", { class: "sem-name", type: "text", value: s.name, "aria-label": "Semester name", maxlength: "40" });
  name.addEventListener("input", (e) => {
    s.name = e.target.value;
    saveState();
  });

  const del = el("button", { class: "x", type: "button", "aria-label": "Remove " + s.name, text: "\u2715" });
  del.addEventListener("click", () => {
    if (s.courses.length === 0 || confirm("Remove " + (s.name || "this semester") + " and its courses?")) removeSemester(s.id);
  });

  const head = el("div", { class: "sem-head" }, [name, gpa, del]);
  const wrap = el("div", { class: "semester" }, [head]);

  if (s.courses.length === 0) wrap.appendChild(el("p", { class: "empty", text: "No courses yet in this semester." }));
  for (const c of s.courses) wrap.appendChild(renderCourse(s, c));

  const add = el("button", { class: "btn", type: "button", text: "Add course" });
  add.addEventListener("click", () => addCourse(s.id));
  wrap.appendChild(el("div", { class: "sem-foot" }, [add]));
  return wrap;
}

function renderCourse(s, c) {
  const name = el("input", { type: "text", value: c.name, placeholder: "e.g. Cataloguing 201", maxlength: "60" });
  name.addEventListener("input", (e) => {
    c.name = e.target.value;
    saveState();
  });

  const unit = el("input", { type: "number", inputmode: "numeric", min: "0", max: String(MAX_UNIT), step: "1", value: String(c.unit) });
  unit.addEventListener("input", (e) => {
    c.unit = clampUnit(e.target.value);
    saveState();
    updateNumbers(s);
  });
  unit.addEventListener("blur", (e) => {
    e.target.value = String(clampUnit(c.unit));
  });

  const grade = el("select");
  for (const g of Object.keys(GRADE_POINTS)) {
    const opt = el("option", { value: g, text: g });
    if (g === c.grade) opt.selected = true;
    grade.appendChild(opt);
  }
  const pts = el("div", { class: "pts", id: "pts-" + c.id, text: pointsFor(c.grade).toFixed(1) });
  grade.addEventListener("change", (e) => {
    c.grade = e.target.value;
    pts.textContent = pointsFor(c.grade).toFixed(1);
    saveState();
    updateNumbers(s);
  });

  const del = el("button", { class: "x", type: "button", "aria-label": "Remove course", text: "\u2715" });
  del.addEventListener("click", () => removeCourse(s.id, c.id));

  const fName = el("label", { class: "f-name", text: "Course" }, [name]);
  const fUnit = el("label", { class: "f-unit", text: "Units" }, [unit]);
  const fGrade = el("label", { class: "f-grade", text: "Grade" }, [grade]);
  return el("div", { class: "course" }, [fName, fUnit, fGrade, pts, del]);
}

function updateNumbers(semester) {
  const g = $("gpa-" + semester.id);
  if (g) g.textContent = "GPA " + semesterGPA(semester).toFixed(2);
  renderSummary();
}

function renderSummary() {
  const o = overall();
  $("cgpa-value").textContent = o.cgpa.toFixed(2);
  $("cgpa-class").textContent = classOfDegree(o.cgpa, o.units);
  $("stat-units").textContent = String(o.units);
  $("stat-semesters").textContent = String(state.semesters.length);
  $("stat-courses").textContent = String(state.semesters.reduce((n, s) => n + s.courses.length, 0));
  renderPlan();
}

/* Past results */

function validatePrior() {
  const err = $("prior-error");
  const c = state.prior.cgpa;
  const u = state.prior.units;
  let msg = "";
  if (c !== "" && (!Number.isFinite(Number(c)) || Number(c) < 0 || Number(c) > 5)) msg = "Past CGPA must be between 0 and 5.";
  else if (u !== "" && (!Number.isFinite(Number(u)) || Number(u) < 0 || Number(u) > MAX_PRIOR_UNITS)) msg = "Past units must be between 0 and " + MAX_PRIOR_UNITS + ".";
  else if ((c === "") !== (u === "")) msg = "Enter both the past CGPA and the past units.";
  err.textContent = msg;
  err.hidden = msg === "";
}

/* Target planner: required GPA over the next N units to reach a target CGPA */

function currentTarget() {
  const sel = $("target-select").value;
  return sel === "custom" ? Number($("custom-target").value) : Number(sel);
}

function renderPlan() {
  const out = $("plan-result");
  const o = overall();
  const target = currentTarget();
  const next = Math.round(Number($("next-units").value));
  out.classList.remove("bad");

  if (!Number.isFinite(target) || target <= 0 || target > 5) {
    out.textContent = "Enter a target between 0 and 5.";
    return;
  }
  if (!Number.isFinite(next) || next < 1) {
    out.textContent = "Enter how many units you have left.";
    return;
  }
  if (o.units === 0) {
    out.textContent = "Add courses or past results first.";
    return;
  }
  const needed = (target * (o.units + next) - o.points) / next;
  if (needed > 5) {
    out.classList.add("bad");
    out.textContent = "Out of reach with " + next + " more units. You would need " + needed.toFixed(2) + ", above the 5.0 cap. Try more units or a lower target.";
  } else if (needed <= 0) {
    out.textContent = "You already clear " + target.toFixed(2) + " even with straight zeros. Keep going.";
  } else {
    const strong = needed.toFixed(2);
    out.innerHTML = "You need a GPA of <strong>" + strong + "</strong> over your next " + next + " units to reach " + target.toFixed(2) + ".";
  }
}

/* Copy and print */

function summaryText() {
  const o = overall();
  const lines = ["CGPA: " + o.cgpa.toFixed(2) + " (" + classOfDegree(o.cgpa, o.units) + ")", "Total units: " + o.units];
  const p = priorValues();
  if (p.units > 0) lines.push("Includes past results: " + Number(state.prior.cgpa).toFixed(2) + " over " + p.units + " units");
  for (const s of state.semesters) lines.push(s.name + ": GPA " + semesterGPA(s).toFixed(2) + " (" + tally(s.courses).units + " units)");
  return lines.join("\n");
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2200);
}

async function copySummary() {
  const text = summaryText();
  try {
    await navigator.clipboard.writeText(text);
    toast("Summary copied");
  } catch (err) {
    const ta = el("textarea", { "aria-hidden": "true" });
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast("Summary copied");
    } catch (e2) {
      toast("Copy failed. Select the text and copy manually.");
    }
    ta.remove();
  }
}

/* Wire up */

function init() {
  $("prior-cgpa").value = state.prior.cgpa;
  $("prior-units").value = state.prior.units;

  $("prior-cgpa").addEventListener("input", (e) => {
    state.prior.cgpa = e.target.value;
    validatePrior();
    saveState();
    renderSummary();
  });
  $("prior-units").addEventListener("input", (e) => {
    state.prior.units = e.target.value;
    validatePrior();
    saveState();
    renderSummary();
  });

  $("target-select").addEventListener("change", () => {
    $("custom-wrap").hidden = $("target-select").value !== "custom";
    renderPlan();
  });
  $("custom-target").addEventListener("input", renderPlan);
  $("next-units").addEventListener("input", renderPlan);

  $("add-semester-btn").addEventListener("click", addSemester);
  $("copy-btn").addEventListener("click", copySummary);
  $("print-btn").addEventListener("click", () => window.print());
  $("reset-btn").addEventListener("click", () => {
    if (confirm("This clears every semester, course and past result. Continue?")) {
      state = emptyState();
      $("prior-cgpa").value = "";
      $("prior-units").value = "";
      validatePrior();
      saveState();
      renderSemesters();
      renderSummary();
    }
  });

  validatePrior();
  renderSemesters();
  renderSummary();
}

init();
