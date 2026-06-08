const fs = require('fs');

// 1. Update ThemeContext.jsx
let themeCtx = fs.readFileSync('src/contexts/ThemeContext.jsx', 'utf8');
themeCtx = themeCtx.replace(
    /if \(window\.matchMedia && window\.matchMedia\('\(prefers-color-scheme: dark\)'\)\.matches\) \{\s*return 'dark';\s*\}/g,
    '// Removed automatic dark mode preference to default to light mode'
);
fs.writeFileSync('src/contexts/ThemeContext.jsx', themeCtx);

// 2. Update index.css
let css = fs.readFileSync('src/index.css', 'utf8');

// Update data-theme dark block
css = css.replace(/\[data-theme='dark'\] \{[\s\S]*?\}/, `[data-theme='dark'] {
  --color-bg: #161623;
  --color-surface: #25243B;
  --color-text-main: #f8fafc;
  --color-text-muted: #8B8BA7;
  --color-border: #33324C;
}`);

// Update data-theme dark body block
css = css.replace(/\[data-theme='dark'\] body \{[\s\S]*?\}/, `[data-theme='dark'] body {
  background-color: #161623;
  background-image: radial-gradient(circle at top right, #25243B 0%, #161623 50%, #11111c 100%);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: #f8fafc;
}`);

// Add Tailwind slate color overrides for dark mode
if (!css.includes('--slate-900-dyn')) {
    css = css.replace(/@theme \{/, `@theme {
  --color-slate-950: var(--slate-950-dyn, #020617);
  --color-slate-900: var(--slate-900-dyn, #0f172a);
  --color-slate-800: var(--slate-800-dyn, #1e293b);
  --color-slate-700: var(--slate-700-dyn, #334155);
`);

    css += `\n\n[data-theme='dark'], .dark {
  --slate-950-dyn: #11111c;
  --slate-900-dyn: #161623;
  --slate-800-dyn: #25243B;
  --slate-700-dyn: #33324C;
}\n`;
}

fs.writeFileSync('src/index.css', css);
console.log("Theme updated successfully.");
