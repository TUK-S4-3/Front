# Repository Guidelines

## Project Structure & Module Organization
- Root HTML entry files: `index.html`, `login.html`, `app.html`.
- Main source files are organized under `src/`:
  - `src/js/`: page-level scripts (`home.js`, `login.js`, `app.js`)
  - `src/css/`: shared and page styles (`base.css`, `home.css`, `login.css`, `app.css`)
- Static assets live in `public/` (for example `public/videos/`).
- Keep new code grouped by feature/page, and avoid mixing unrelated UI logic in one file.

## Build, Test, and Development Commands
- `npm run dev`: start the Vite dev server for local development.
- `npm run build`: create a production build with Vite.
- `npm install`: install dependencies before first run.

Current `package.json` defines only `dev` and `build` scripts, so contributors should keep commands lightweight and avoid adding heavy tooling unless needed.

## Coding Style & Naming Conventions
- Use 2-space indentation in HTML/CSS/JS and keep line length readable.
- Use lowercase, descriptive filenames for page assets (e.g., `login.js`, `home.css`).
- Keep CSS split into `base` (shared) and page-specific files.
- Prefer small, focused JS modules with clear DOM responsibility per page.
- Match existing style before introducing a new pattern.

## Testing Guidelines
- No automated test script is currently configured in `package.json`.
- For UI changes, perform manual checks at minimum:
  - open all entry pages (`index.html`, `login.html`, `app.html`)
  - verify layout, navigation, and console errors in dev mode
  - validate production output with `npm run build`
- If tests are added later, place them near the related feature or under a dedicated `tests/` directory.

## Commit & Pull Request Guidelines
- Recent history favors concise Korean messages, often with a scope prefix (e.g., `UI/UX 개선: app.html 및 스타일 업데이트`).
- Recommended commit format: `<영역>: <변경 요약>` (one logical change per commit).
- PRs should include:
  - what changed and why
  - affected pages/files
  - screenshots or short video for UI updates
  - linked issue/task when available

## Agent-Specific Notes
- Prefer minimal diffs.
- Avoid network/download operations during automated changes.
- When uncertainty exists, mark it as `추정` and cite the source path.
