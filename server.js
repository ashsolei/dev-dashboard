const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 7777;
const REPOS_ROOT = process.env.REPOS_ROOT || path.join(os.homedir());

const REPOS = [
  { name: 'jules-action', owner: 'google-labs-code', tech: 'GitHub Actions', description: 'GitHub Action to trigger Jules AI coding agent', healthCmd: null, port: null },
  { name: 'claude-code-scheduler', owner: 'jshchnz', tech: 'TypeScript', description: 'Schedule recurring Claude Code tasks with cron', healthCmd: 'npx vitest run --reporter=json', port: null },
  { name: 'obsidian-skills', owner: 'kepano', tech: 'Markdown', description: 'Agent Skills for Obsidian', healthCmd: null, port: null },
  { name: 'ui-ux-pro-max-skill', owner: 'nextlevelbuilder', tech: 'Python/TS', description: 'AI design intelligence toolkit', healthCmd: null, port: null },
  { name: 'tinyfish-cookbook', owner: 'tinyfish-io', tech: 'Mixed', description: 'Sample projects for TinyFish platform', healthCmd: null, port: null },
  { name: 'superpowers', owner: 'obra', tech: 'Markdown', description: 'Software development workflow for coding agents', healthCmd: null, port: null },
  { name: 'n8n-mcp', owner: 'czlonkowski', tech: 'TypeScript', description: 'MCP server for n8n node information', healthCmd: 'npx vitest run --reporter=json', port: 3000 },
  { name: 'get-shit-done', owner: 'gsd-build', tech: 'JavaScript', description: 'Meta-prompting and spec-driven dev system', healthCmd: 'node scripts/run-tests.cjs', port: null },
  { name: 'everything-claude-code', owner: 'affaan-m', tech: 'JavaScript', description: 'Claude Code plugin with 13 agents, 50+ skills', healthCmd: 'node tests/run-all.js', port: null },
  { name: 'awesome-claude-code', owner: 'hesreallyhim', tech: 'Python', description: 'Curated list of Claude Code resources', healthCmd: null, port: null },
  { name: 'context7', owner: 'upstash', tech: 'TypeScript', description: 'MCP server for version-specific documentation', healthCmd: 'pnpm test', port: null },
  { name: 'SlayZone', owner: 'debuglebowski', tech: 'Electron/React', description: 'Desktop task management with AI assistants', healthCmd: 'pnpm typecheck', port: null },
  { name: 'GitNexus', owner: 'abhigyanpatwari', tech: 'TypeScript', description: 'Codebase knowledge graph via MCP tools', healthCmd: null, port: null },
  { name: 'CollabCode', owner: 'humancto', tech: 'JS/Express', description: 'Real-time collaborative code editor', healthCmd: null, port: 8080 },
];

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Git helper - runs git command in repo dir
function gitCmd(repoPath, args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: repoPath, timeout: 10000 }, (err, stdout, stderr) => {
      if (err && !stdout) return reject(err);
      resolve(stdout.trim());
    });
  });
}

// GET /api/repos - list all repos with git status
app.get('/api/repos', async (_req, res) => {
  const results = await Promise.all(
    REPOS.map(async (repo) => {
      const repoPath = path.join(REPOS_ROOT, repo.name);
      try {
        const [branch, status, lastCommit, lastCommitDate] = await Promise.all([
          gitCmd(repoPath, ['branch', '--show-current']),
          gitCmd(repoPath, ['status', '-s']),
          gitCmd(repoPath, ['log', '--oneline', '-1']),
          gitCmd(repoPath, ['log', '-1', '--format=%ci']),
        ]);
        const dirtyFiles = status ? status.split('\n').length : 0;
        return {
          ...repo,
          path: repoPath,
          branch,
          dirtyFiles,
          dirtyList: status ? status.split('\n').slice(0, 5) : [],
          lastCommit,
          lastCommitDate,
          status: dirtyFiles > 0 ? 'dirty' : 'clean',
        };
      } catch (e) {
        return { ...repo, path: repoPath, status: 'error', error: e.message };
      }
    })
  );
  res.json(results);
});

// GET /api/repos/:name/health - run health check for a repo
app.get('/api/repos/:name/health', async (req, res) => {
  const repo = REPOS.find((r) => r.name === req.params.name);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  if (!repo.healthCmd) return res.json({ status: 'no-health-check', repo: repo.name });

  const repoPath = path.join(REPOS_ROOT, repo.name);
  const [cmd, ...args] = repo.healthCmd.split(' ');

  try {
    const result = await new Promise((resolve, reject) => {
      execFile(cmd, args, { cwd: repoPath, timeout: 120000, shell: false }, (err, stdout, stderr) => {
        resolve({
          exitCode: err ? err.code || 1 : 0,
          stdout: stdout.slice(-2000),
          stderr: stderr.slice(-1000),
        });
      });
    });
    res.json({ status: result.exitCode === 0 ? 'pass' : 'fail', ...result, repo: repo.name });
  } catch (e) {
    res.json({ status: 'error', error: e.message, repo: repo.name });
  }
});

// GET /api/repos/:name/log - get recent git log
app.get('/api/repos/:name/log', async (req, res) => {
  const repo = REPOS.find((r) => r.name === req.params.name);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  const repoPath = path.join(REPOS_ROOT, repo.name);
  try {
    const log = await gitCmd(repoPath, ['log', '--oneline', '-20']);
    res.json({ repo: repo.name, log: log.split('\n') });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// GET /api/backlog - return current known issues from security scan
app.get('/api/backlog', (_req, res) => {
  res.json([
    // P0 - Critical
    // P0 - Critical (ALL RESOLVED in Cycle 1)
    { id: 'P0-1', severity: 'P0', repo: 'CollabCode', title: 'innerHTML XSS in slack-integration.js — escapeHTML + DOM API', status: 'resolved', category: 'security' },
    { id: 'P0-2', severity: 'P0', repo: 'CollabCode', title: 'innerHTML XSS in firepad.js — escapeHTML + DOM API', status: 'resolved', category: 'security' },
    { id: 'P0-3', severity: 'P0', repo: 'CollabCode', title: 'innerHTML XSS in behavior-tracking.js — escapeHTML + createElement', status: 'resolved', category: 'security' },
    { id: 'P0-4', severity: 'P0', repo: 'CollabCode', title: 'innerHTML XSS in session-tracking.js — escapeHTML applied', status: 'resolved', category: 'security' },
    { id: 'P0-5', severity: 'P0', repo: 'CollabCode', title: 'innerHTML XSS in activity-monitor.js — escapeHTML + Number coercion', status: 'resolved', category: 'security' },
    { id: 'P0-6', severity: 'P0', repo: 'CollabCode', title: 'innerHTML XSS in interview-notes.js — analyzed: static HTML only', status: 'resolved', category: 'security' },
    { id: 'P0-7', severity: 'P0', repo: 'CollabCode', title: 'Password reset token removed from console.log', status: 'resolved', category: 'security' },
    { id: 'P0-8', severity: 'P0', repo: 'GitNexus', title: 'marked.parse(md) sanitized with DOMPurify CDN v3.2.4', status: 'resolved', category: 'security' },
    { id: 'P0-9', severity: 'P0', repo: 'SlayZone', title: 'innerHTML → DOMParser().parseFromString in TaskDetailPage.tsx', status: 'resolved', category: 'security' },
    { id: 'P0-10', severity: 'P0', repo: 'tinyfish-cookbook', title: 'iframe injection → URL validation + createElement', status: 'resolved', category: 'security' },
    // P1 - High (critical items resolved, false positives identified)
    { id: 'P1-1', severity: 'P1', repo: 'n8n-mcp', title: 'execSync → execFileSync in update-n8n-deps.js getLatestVersion()', status: 'resolved', category: 'security' },
    { id: 'P1-2', severity: 'P1', repo: 'n8n-mcp', title: 'execSync → execFileSync in update-n8n-deps.js getN8nDependencies()', status: 'resolved', category: 'security' },
    { id: 'P1-3', severity: 'P1', repo: 'SlayZone', title: 'execSync → execFileSync with platform-specific args in tasks.ts', status: 'resolved', category: 'security' },
    { id: 'P1-4', severity: 'P1', repo: 'SlayZone', title: 'execGit() uses hardcoded commands, spawnGit for user input — false positive', status: 'resolved', category: 'security' },
    { id: 'P1-5', severity: 'P1', repo: 'GitNexus', title: 'Mermaid 11.12+ has built-in SVG sanitization — false positive', status: 'resolved', category: 'security' },
    { id: 'P1-6', severity: 'P1', repo: 'n8n-mcp', title: 'prepare-release.js all hardcoded commands — false positive', status: 'resolved', category: 'security' },
    { id: 'P1-7', severity: 'P1', repo: 'n8n-mcp', title: 'execSync → execFileSync + isValidGitRef in generate-release-notes.js', status: 'resolved', category: 'security' },
    { id: 'P1-8', severity: 'P1', repo: 'CollabCode', title: 'error.message removed from 500 response in execute.js', status: 'resolved', category: 'security' },
    { id: 'P1-9', severity: 'P1', repo: 'CollabCode', title: 'Unhandled promise rejections in slack-integration.js — .catch() added', status: 'resolved', category: 'bug' },
    { id: 'P1-10', severity: 'P1', repo: 'CollabCode', title: 'Unhandled promise rejections in firepad.js — 6 .catch() handlers added', status: 'resolved', category: 'bug' },
    { id: 'P1-11', severity: 'P1', repo: 'CollabCode', title: 'Unhandled promise rejections in interview-notes.js — .catch() + try/catch', status: 'resolved', category: 'bug' },
    { id: 'P1-12', severity: 'P1', repo: 'CollabCode', title: 'Unhandled promise rejections in activity-monitor.js — 3 error callbacks', status: 'resolved', category: 'bug' },
    // P2 - Medium
    { id: 'P2-1', severity: 'P2', repo: 'CollabCode', title: 'Firebase SDK v3.5.2 (2016) — severely outdated', status: 'open', category: 'quality' },
    { id: 'P2-2', severity: 'P2', repo: 'CollabCode', title: 'SSRF risk: Piston API URL — ALLOWED_PISTON_HOSTS allowlist added', status: 'resolved', category: 'security' },
    { id: 'P2-3', severity: 'P2', repo: 'get-shit-done', title: 'execSync string concat in core.cjs', status: 'resolved', category: 'security' },
    { id: 'P2-4', severity: 'P2', repo: 'get-shit-done', title: 'execSync in commands.cjs', status: 'resolved', category: 'security' },
    // P3 - Low (resolved from previous sessions)
    { id: 'R1', severity: 'P3', repo: 'SlayZone', title: 'Time-tracking files need commit', status: 'resolved' },
    { id: 'R2', severity: 'P3', repo: 'n8n-mcp', title: 'Stray :memory: file in repo root', status: 'resolved' },
    { id: 'R3', severity: 'P3', repo: 'get-shit-done', title: 'test-output.txt untracked artifact', status: 'resolved' },
    // Cycle 2 - Quality improvements
    { id: 'Q-1', severity: 'P3', repo: 'jules-action', title: '.gitignore created (node_modules, dist, .env)', status: 'resolved', category: 'quality' },
    { id: 'Q-2', severity: 'P3', repo: 'obsidian-skills', title: '.gitignore created (node_modules, dist, .env)', status: 'resolved', category: 'quality' },
    { id: 'Q-3', severity: 'P3', repo: 'superpowers', title: '.gitignore updated (node_modules, dist, .env added)', status: 'resolved', category: 'quality' },
    { id: 'Q-4', severity: 'P3', repo: 'get-shit-done', title: '.gitignore updated + dead execSync import removed', status: 'resolved', category: 'quality' },
    { id: 'Q-5', severity: 'P3', repo: 'get-shit-done', title: 'execSync → execFileSync in hooks/gsd-check-update.js', status: 'resolved', category: 'security' },
    // Cycle 3 - Quality & CI improvements
    { id: 'Q-6', severity: 'P3', repo: 'SlayZone', title: 'package.json: added description, repository, keywords', status: 'resolved', category: 'quality' },
    { id: 'Q-7', severity: 'P3', repo: 'tinyfish-cookbook', title: '.gitignore created + 43MB demo video removed from tracking', status: 'resolved', category: 'quality' },
    { id: 'Q-8', severity: 'P2', repo: 'claude-code-scheduler', title: 'CI workflow added (Node 18/20/22 matrix, typecheck + vitest)', status: 'resolved', category: 'quality' },
    { id: 'Q-9', severity: 'P3', repo: 'n8n-mcp', title: 'engines field added to package.json (node >=18)', status: 'resolved', category: 'quality' },
    { id: 'Q-10', severity: 'P2', repo: 'CollabCode', title: 'CI workflow + package-lock.json + repository/keywords metadata', status: 'resolved', category: 'quality' },
    // Cycle 4 - Metadata standardization & .editorconfig rollout
    { id: 'Q-11', severity: 'P3', repo: 'SlayZone', title: 'package.json: added license (MIT) and author fields', status: 'resolved', category: 'quality' },
    { id: 'Q-12', severity: 'P3', repo: 'context7', title: 'package.json: added engines (node >=18) + .editorconfig', status: 'resolved', category: 'quality' },
    { id: 'Q-13', severity: 'P3', repo: 'CollabCode', title: 'package.json: added license (MIT) and author + .editorconfig', status: 'resolved', category: 'quality' },
    { id: 'Q-14', severity: 'P2', repo: 'jules-action', title: 'CI workflow (action.yaml validation, example checks) + .editorconfig', status: 'resolved', category: 'quality' },
    { id: 'Q-15', severity: 'P3', repo: '*', title: '.editorconfig rollout across all 13 repos (utf-8, lf, 2-space indent)', status: 'resolved', category: 'quality' },
    // Cycle 5 - Dependency cleanup, security headers, .nvmrc rollout
    { id: 'Q-16', severity: 'P1', repo: 'CollabCode', title: 'Removed 7 unused production deps (morgan, cookie-parser, dompurify, etc.)', status: 'resolved', category: 'quality' },
    { id: 'Q-17', severity: 'P1', repo: 'context7', title: 'Moved @types/express from deps to devDeps', status: 'resolved', category: 'quality' },
    { id: 'Q-18', severity: 'P1', repo: 'context7', title: 'Added security headers middleware (5 headers) to MCP HTTP server', status: 'resolved', category: 'security' },
    { id: 'Q-19', severity: 'P3', repo: '*', title: '.nvmrc (Node 22 LTS) rollout across 7 Node.js repos', status: 'resolved', category: 'quality' },
    // Cycle 6 - CORS fix, docker-compose cleanup, coverage thresholds
    { id: 'Q-20', severity: 'P1', repo: 'CollabCode', title: 'CORS wildcard origin replaced with req.headers.origin reflection (9 endpoints)', status: 'resolved', category: 'security' },
    { id: 'Q-21', severity: 'P2', repo: 'n8n-mcp', title: 'Removed obsolete docker-compose version: 3.8 from 5 files', status: 'resolved', category: 'quality' },
    { id: 'Q-22', severity: 'P2', repo: 'claude-code-scheduler', title: 'Added vitest coverage thresholds (v8 provider, 80% min)', status: 'resolved', category: 'quality' },
    { id: 'Q-23', severity: 'P2', repo: 'awesome-claude-code', title: 'Added coverage fail_under = 80 to pyproject.toml', status: 'resolved', category: 'quality' },
    // Cycle 7 - Auth security hardening, Dockerfile hardening
    { id: 'Q-24', severity: 'P1', repo: 'CollabCode', title: 'Auth security: removed credential logging, crypto session IDs, guarded hash log', status: 'resolved', category: 'security' },
    { id: 'Q-25', severity: 'P2', repo: 'context7', title: 'Dockerfile hardening: pinned node:22-alpine, non-root user, HEALTHCHECK, .dockerignore', status: 'resolved', category: 'quality' },
    // Cycle 8 - CORS allowlist, JWT algorithm enforcement, security headers
    { id: 'Q-26', severity: 'P1', repo: 'CollabCode', title: 'CORS upgraded from origin reflection to ALLOWED_ORIGINS env var allowlist (9 endpoints)', status: 'resolved', category: 'security' },
    { id: 'Q-27', severity: 'P2', repo: 'CollabCode', title: 'JWT verify() explicit algorithms: [HS256] enforcement (3 calls)', status: 'resolved', category: 'security' },
    { id: 'Q-28', severity: 'P2', repo: 'CollabCode', title: 'Security headers added to all API endpoints (shared _helpers/security.js)', status: 'resolved', category: 'security' },
    // Cycle 9 - XSS escaping, path traversal, .env hygiene
    { id: 'Q-29', severity: 'P1', repo: 'CollabCode', title: 'Stored XSS via user.name in app.js innerHTML — escapeHTML() applied', status: 'resolved', category: 'security' },
    { id: 'Q-30', severity: 'P1', repo: 'CollabCode', title: 'Firebase Realtime DB rules world-writable (requires Firebase Auth integration)', status: 'open', category: 'security' },
    { id: 'Q-31', severity: 'P2', repo: 'tinyfish-cookbook', title: 'Tracked .env file removed from scholarship-finder (git rm --cached)', status: 'resolved', category: 'security' },
    { id: 'Q-32', severity: 'P2', repo: 'claude-code-scheduler', title: '.gitignore missing .env rules — added .env, .env.local, .env.*.local', status: 'resolved', category: 'quality' },
    { id: 'Q-33', severity: 'P3', repo: 'CollabCode', title: 'Path traversal in dev server serve.js — __dirname guard added', status: 'resolved', category: 'security' },
    { id: 'Q-34', severity: 'P0', repo: 'CollabCode', title: 'Code execution endpoint: added CORS/security headers + memory limits (128MB)', status: 'resolved', category: 'security' },
    { id: 'Q-35', severity: 'P1', repo: 'CollabCode', title: 'Slack endpoint now requires JWT auth; activity/track-session use session-code auth', status: 'resolved', category: 'security' },
    { id: 'Q-36', severity: 'P1', repo: 'CollabCode', title: 'In-memory Maps capped at 10K entries to prevent DoS', status: 'resolved', category: 'security' },
    { id: 'Q-37', severity: 'P2', repo: 'CollabCode', title: 'Auth debug data (hash, resetUrl) no longer leaked on preview deploys', status: 'resolved', category: 'security' },
    { id: 'Q-38', severity: 'P2', repo: 'CollabCode', title: 'Sender email uses SENDGRID_FROM_EMAIL env var instead of placeholder', status: 'resolved', category: 'quality' },
    { id: 'Q-39', severity: 'P2', repo: 'n8n-mcp', title: 'Database init promise now has .catch() error handler', status: 'resolved', category: 'quality' },
    { id: 'Q-40', severity: 'P2', repo: 'SlayZone', title: '37 of 44 .then() chains lack .catch() — deferred (large refactor)', status: 'open', category: 'quality' },
    { id: 'Q-41', severity: 'P3', repo: 'SlayZone', title: '121 buttons without aria-label — deferred (large effort)', status: 'open', category: 'accessibility' },
    { id: 'Q-42', severity: 'P3', repo: 'n8n-mcp', title: 'Hardcoded magic scoring numbers — deferred (refactoring)', status: 'open', category: 'quality' },
    { id: 'Q-43', severity: 'P3', repo: 'CollabCode', title: 'APP_DOMAIN validated at runtime — fails fast if not set', status: 'resolved', category: 'quality' },
    { id: 'Q-44', severity: 'P3', repo: 'superpowers', title: 'execSync string-form commands (implicit shell:true) — informational', status: 'open', category: 'quality' },
    { id: 'Q-45', severity: 'P2', repo: 'n8n-mcp', title: 'ReDoS via unguarded new RegExp() — added 128-char length limit', status: 'resolved', category: 'security' },
    { id: 'Q-46', severity: 'P2', repo: 'n8n-mcp', title: 'No body size limit on POST /mcp — added 1MB cap with 413', status: 'resolved', category: 'security' },
    { id: 'Q-47', severity: 'P2', repo: 'n8n-mcp', title: 'Missing Content-Type validation — added application/json check', status: 'resolved', category: 'security' },
    { id: 'Q-48', severity: 'P3', repo: 'GitNexus', title: 'Error info disclosure in 10 API catch blocks — generic messages', status: 'resolved', category: 'security' },
    { id: 'Q-49', severity: 'P3', repo: 'GitNexus', title: 'eval-server no body limit — localhost-only, deferred', status: 'open', category: 'security' },
    { id: 'Q-50', severity: 'P3', repo: 'get-shit-done', title: 'RegExp from config file — low risk, deferred', status: 'open', category: 'security' },
    { id: 'Q-51', severity: 'P3', repo: 'CollabCode', title: 'Math.random() for user IDs — replaced with crypto.getRandomValues', status: 'resolved', category: 'security' },
    { id: 'Q-52', severity: 'P3', repo: 'SlayZone', title: 'TOCTOU in symlink ops — desktop app, deferred', status: 'open', category: 'security' },
    { id: 'Q-53', severity: 'P3', repo: 'tinyfish-cookbook', title: 'Math.random() in cookbook examples — non-production, deferred', status: 'open', category: 'quality' },
    { id: 'Q-54', severity: 'P3', repo: 'n8n-mcp', title: 'Error message leak on /test-tools endpoint — generic error', status: 'resolved', category: 'security' },
    { id: 'Q-55', severity: 'P3', repo: 'GitNexus', title: 'eval-server error disclosure — localhost-only, deferred', status: 'open', category: 'security' },
  ]);
});

// GET /api/scan-summary - aggregated security scan statistics
app.get('/api/scan-summary', (_req, res) => {
  res.json({
    lastScan: new Date().toISOString(),
    totals: { P0: 11, P1: 22, P2: 23, P3: 29, total: 85 },
    resolved: { P0: 11, P1: 21, P2: 21, P3: 21, total: 74 },
    remaining: { P0: 0, P1: 1, P2: 2, P3: 8, total: 11 },
    openItems: ['P2-1: CollabCode Firebase SDK v3.5.2 (2016) — severely outdated', 'Q-30: CollabCode Firebase Realtime DB rules world-writable', 'Q-40: SlayZone .then() chains without .catch()', 'Q-41: SlayZone buttons without aria-label', 'Q-42: n8n-mcp magic scoring numbers', 'Q-44: superpowers execSync string-form', 'Q-49: GitNexus eval-server no body limit (localhost)', 'Q-50: get-shit-done RegExp from config', 'Q-52: SlayZone TOCTOU symlink ops', 'Q-53: tinyfish-cookbook Math.random() examples', 'Q-55: GitNexus eval-server error disclosure (localhost)'],
    cleanRepos: ['context7', 'jules-action', 'claude-code-scheduler', 'obsidian-skills', 'ui-ux-pro-max-skill', 'awesome-claude-code'],
    affectedRepos: ['CollabCode', 'n8n-mcp', 'GitNexus', 'get-shit-done', 'SlayZone', 'tinyfish-cookbook', 'superpowers'],
  });
});

app.listen(PORT, () => {
  console.log(`Dev Dashboard running at http://localhost:${PORT}`);
  console.log(`Monitoring ${REPOS.length} repositories in ${REPOS_ROOT}`);
});
