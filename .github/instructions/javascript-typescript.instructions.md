---
applyTo: "**/*.{js,jsx,ts,tsx,mjs,cjs}"
---

# JavaScript / TypeScript conventions

- Use ES modules (`import`/`export`), never CommonJS unless explicitly configured
- Prefer `const` over `let`; never use `var`
- Use async/await over raw Promises; avoid callback patterns
- Use strict equality (`===` / `!==`)
- Destructure objects and arrays where it improves readability
- Handle errors with try/catch; never swallow errors silently
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Pin all third-party action refs to full SHA in GitHub Actions workflows
- Follow the project's existing ESLint and Prettier configuration
