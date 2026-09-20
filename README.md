# CGPA Calculator

A free web app for calculating GPA and CGPA on the 5.0 scale used by Nigerian universities.

## What it does

- Add semesters and courses, set unit loads, and tap a grade (A to F)
- Automatic GPA per semester and a running CGPA
- Past results: enter an earlier CGPA and unit total instead of retyping old courses
- Target planner: see the GPA you need over your next units to reach a class of degree
- Copy a text summary or print the page
- Data is saved in your browser (localStorage) and never leaves your device

## Grade scale

| Score  | Grade | Point |
|--------|-------|-------|
| 70-100 | A     | 5.0   |
| 60-69  | B     | 4.0   |
| 50-59  | C     | 3.0   |
| 45-49  | D     | 2.0   |
| 40-44  | E     | 1.0   |
| 0-39   | F     | 0.0   |

Class of degree: 4.50 and above First Class, 3.50 Second Class Upper, 2.40 Second Class Lower, 1.50 Third Class.

## Run it locally

No build step and no dependencies. Open `index.html` in a browser, or serve the folder with any static server.

```
git clone https://github.com/JoeBuildsThings/cgpa-calculator.git
cd cgpa-calculator
```

## Deploy

Connect the repo to Netlify or Vercel for auto deploys, or drag the folder in. No build command is needed.

## Files

- `index.html` page structure
- `style.css` layout and theme (light result-slip look, pinned CGPA header)
- `script.js` state, math, and rendering

## Privacy

This app has no accounts, no analytics, and no server. Everything you enter stays in your browser's localStorage. The only outside request is Google Fonts for typography.
