// CGPA Calculator, UNIOSUN 5.0 scale
// Data model: array of semesters, each with a name and an array of courses
// Each course: { name, unit, grade }
// State persists to localStorage under key "cgpa-data"

const GRADE_POINTS = {
  A: 5.0,
  B: 4.0,
  C: 3.0,
  D: 2.0,
  E: 1.0,
  F: 0.0,
};

const STORAGE_KEY = "cgpa-data";

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { semesters: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.semesters)) return { semesters: [] };
    return parsed;
  } catch (err) {
    console.error("Could not read saved data, starting fresh.", err);
    return { semesters: [] };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Could not save data.", err);
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function addSemester() {
  state.semesters.push({
    id: uid(),
    name: "Semester " + (state.semesters.length + 1),
    courses: [],
  });
  saveState();
  render();
}

function removeSemester(semesterId) {
  state.semesters = state.semesters.filter((s) => s.id !== semesterId);
  saveState();
  render();
}

function addCourse(semesterId) {
  const semester = state.semesters.find((s) => s.id === semesterId);
  if (!semester) return;
  semester.courses.push({ id: uid(), name: "", unit: 3, grade: "A" });
  saveState();
  render();
}

function removeCourse(semesterId, courseId) {
  const semester = state.semesters.find((s) => s.id === semesterId);
  if (!semester) return;
  semester.courses = semester.courses.filter((c) => c.id !== courseId);
  saveState();
  render();
}

function updateSemesterName(semesterId, name) {
  const semester = state.semesters.find((s) => s.id === semesterId);
  if (!semester) return;
  semester.name = name;
  saveState();
}

function updateCourse(semesterId, courseId, field, value) {
  const semester = state.semesters.find((s) => s.id === semesterId);
  if (!semester) return;
  const course = semester.courses.find((c) => c.id === courseId);
  if (!course) return;
  course[field] = value;
  saveState();
  renderMetrics();
}

function semesterGPA(semester) {
  let totalPoints = 0;
  let totalUnits = 0;
  for (const course of semester.courses) {
    const unit = Number(course.unit) || 0;
    const point = GRADE_POINTS[course.grade] ?? 0;
    totalPoints += unit * point;
    totalUnits += unit;
  }
  return totalUnits > 0 ? totalPoints / totalUnits : 0;
}

function overallCGPA() {
  let totalPoints = 0;
  let totalUnits = 0;
  for (const semester of state.semesters) {
    for (const course of semester.courses) {
      const unit = Number(course.unit) || 0;
      const point = GRADE_POINTS[course.grade] ?? 0;
      totalPoints += unit * point;
      totalUnits += unit;
    }
  }
  return { cgpa: totalUnits > 0 ? totalPoints / totalUnits : 0, totalUnits };
}

function classOfDegree(cgpa) {
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa > 0) return "Pass";
  return "Add courses to see your standing";
}

function render() {
  renderSemesters();
  renderMetrics();
}

function renderSemesters() {
  const container = document.getElementById("semesters-container");
  container.innerHTML = "";

  if (state.semesters.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.style.textAlign = "center";
    empty.innerHTML = '<div class="empty-state">No semesters yet. Add one to start entering your courses.</div>';
    container.appendChild(empty);
    return;
  }

  for (const semester of state.semesters) {
    const block = document.createElement("div");
    block.className = "semester-block";

    const titleRow = document.createElement("div");
    titleRow.className = "semester-title-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = semester.name;
    nameInput.addEventListener("input", (e) => updateSemesterName(semester.id, e.target.value));
    nameInput.addEventListener("blur", renderMetrics);

    const rightGroup = document.createElement("div");
    rightGroup.style.display = "flex";
    rightGroup.style.alignItems = "center";
    rightGroup.style.gap = "8px";

    const gpaLabel = document.createElement("span");
    gpaLabel.className = "pill";
    gpaLabel.textContent = "GPA " + semesterGPA(semester).toFixed(2);
    gpaLabel.id = "gpa-label-" + semester.id;

    const removeBtn = document.createElement("button");
    removeBtn.className = "icon-btn";
    removeBtn.title = "Remove semester";
    removeBtn.textContent = "\u2715";
    removeBtn.addEventListener("click", () => removeSemester(semester.id));

    rightGroup.appendChild(gpaLabel);
    rightGroup.appendChild(removeBtn);
    titleRow.appendChild(nameInput);
    titleRow.appendChild(rightGroup);
    block.appendChild(titleRow);

    const list = document.createElement("div");
    list.className = "subject-list";

    if (semester.courses.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No courses yet in this semester.";
      list.appendChild(empty);
    }

    for (const course of semester.courses) {
      list.appendChild(renderCourseRow(semester, course));
    }

    block.appendChild(list);

    const addRow = document.createElement("div");
    addRow.className = "add-row";
    addRow.innerHTML = '<span>Add a course with its unit and grade</span>';
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-secondary";
    addBtn.innerHTML = "<span>+</span><span>Add course</span>";
    addBtn.addEventListener("click", () => addCourse(semester.id));
    addRow.appendChild(addBtn);
    block.appendChild(addRow);

    container.appendChild(block);
  }
}

function renderCourseRow(semester, course) {
  const row = document.createElement("div");
  row.className = "subject-row";

  const nameWrap = document.createElement("div");
  nameWrap.innerHTML = '<div class="subject-label">Course</div>';
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "e.g. Cataloguing 201";
  nameInput.value = course.name;
  nameInput.addEventListener("input", (e) => updateCourse(semester.id, course.id, "name", e.target.value));
  nameWrap.appendChild(nameInput);

  const unitWrap = document.createElement("div");
  unitWrap.innerHTML = '<div class="subject-label">Units</div>';
  const unitInput = document.createElement("input");
  unitInput.type = "number";
  unitInput.min = "0";
  unitInput.max = "10";
  unitInput.value = course.unit;
  unitInput.addEventListener("input", (e) => {
    updateCourse(semester.id, course.id, "unit", e.target.value);
    refreshSemesterGPA(semester.id);
  });
  unitWrap.appendChild(unitInput);

  const gradeWrap = document.createElement("div");
  gradeWrap.innerHTML = '<div class="subject-label">Grade</div>';
  const gradeSelect = document.createElement("select");
  for (const g of Object.keys(GRADE_POINTS)) {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    if (g === course.grade) opt.selected = true;
    gradeSelect.appendChild(opt);
  }
  gradeSelect.addEventListener("change", (e) => {
    updateCourse(semester.id, course.id, "grade", e.target.value);
    refreshSemesterGPA(semester.id);
    refreshPointsPill(course.id, e.target.value);
  });
  gradeWrap.appendChild(gradeSelect);

  const pointsWrap = document.createElement("div");
  pointsWrap.innerHTML = '<div class="subject-label">Points</div>';
  const pointsPill = document.createElement("div");
  pointsPill.className = "grade-pill";
  pointsPill.id = "points-pill-" + course.id;
  pointsPill.innerHTML = "<span>" + GRADE_POINTS[course.grade].toFixed(1) + "</span>";
  pointsWrap.appendChild(pointsPill);

  const removeBtn = document.createElement("button");
  removeBtn.className = "icon-btn";
  removeBtn.title = "Remove course";
  removeBtn.textContent = "\u2715";
  removeBtn.addEventListener("click", () => removeCourse(semester.id, course.id));

  row.appendChild(nameWrap);
  row.appendChild(unitWrap);
  row.appendChild(gradeWrap);
  row.appendChild(pointsWrap);
  row.appendChild(removeBtn);

  return row;
}

function refreshSemesterGPA(semesterId) {
  const semester = state.semesters.find((s) => s.id === semesterId);
  if (!semester) return;
  const label = document.getElementById("gpa-label-" + semesterId);
  if (label) label.textContent = "GPA " + semesterGPA(semester).toFixed(2);
  renderMetrics();
}

function refreshPointsPill(courseId, grade) {
  const pill = document.getElementById("points-pill-" + courseId);
  if (pill) pill.innerHTML = "<span>" + GRADE_POINTS[grade].toFixed(1) + "</span>";
}

function renderMetrics() {
  const { cgpa, totalUnits } = overallCGPA();
  document.getElementById("cgpa-value").textContent = cgpa.toFixed(2);
  document.getElementById("cgpa-class").textContent = classOfDegree(cgpa);
  document.getElementById("total-units-label").textContent = totalUnits + " units";

  const courseCount = state.semesters.reduce((sum, s) => sum + s.courses.length, 0);
  document.getElementById("chip-semesters").textContent = state.semesters.length + " semesters";
  document.getElementById("chip-courses").textContent = courseCount + " courses";

  renderSparkline();
}

function renderSparkline() {
  const poly = document.getElementById("sparkline-poly");
  const labelsWrap = document.getElementById("sparkline-labels");
  labelsWrap.innerHTML = "";

  const gpas = state.semesters.map((s) => semesterGPA(s));

  if (gpas.length === 0) {
    poly.setAttribute("points", "0,15 100,15");
    return;
  }

  const maxScale = 5.0;
  const step = gpas.length > 1 ? 100 / (gpas.length - 1) : 0;
  const points = gpas.map((g, i) => {
    const x = gpas.length > 1 ? i * step : 50;
    const y = 28 - (g / maxScale) * 26;
    return x + "," + y;
  });
  poly.setAttribute("points", points.join(" "));

  state.semesters.forEach((s, i) => {
    const span = document.createElement("span");
    span.textContent = s.name.length > 10 ? s.name.slice(0, 10) + "\u2026" : s.name;
    labelsWrap.appendChild(span);
  });
}

document.getElementById("add-semester-btn").addEventListener("click", addSemester);

document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("This clears every semester and course you've entered. Continue?")) {
    state = { semesters: [] };
    saveState();
    render();
  }
});

render();

