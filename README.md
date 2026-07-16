# CGPA Calculator

A simple web app for calculating GPA and CGPA on the 5.0 grading scale used by Nigerian universities (UNIOSUN and similar NUC-affiliated schools).

## What it does

- Add multiple semesters, each with its own list of courses
- Enter each course's unit load and grade (A to F)
- Get an automatic GPA per semester and a running CGPA across all semesters
- Data is saved in your browser (localStorage), so it's still there next time you open the app
- Shows your current class of degree based on CGPA

## Grade scale

| Score   | Grade | Point |
|---------|-------|-------|
| 70-100  | A     | 5.0   |
| 60-69   | B     | 4.0   |
| 50-59   | C     | 3.0   |
| 45-49   | D     | 2.0   |
| 40-44   | E     | 1.0   |
| 0-39    | F     | 0.0   |

## Running it locally

No build step, no dependencies. Just open `index.html` in a browser.

```
git clone https://github.com/JOE-CODER01/cgpa-calculator.git
cd cgpa-calculator
```

Then open `index.html` directly, or serve it with any static server.

## Deploying

Drag the folder into Netlify, or connect the GitHub repo for auto deploys. No build command needed since it's plain HTML, CSS, and JS.

## Tech

HTML, CSS, and vanilla JavaScript. No frameworks, no build tools.

