/**
 * BLOCKD — run frontend + backend together (one command).
 *
 * Usage (from repo root):
 *   node run-dev.mjs
 *
 * Prerequisites:
 *   - Backend: Python 3 with uvicorn + deps (see BlockD projects/blockd-backend/README.md)
 *   - Frontend: npm install already run in projects/blockd-frontend
 *   - Configure projects/blockd-backend/.env with DATABASE_URL=postgresql://... (not MongoDB)
 *
 * Stops both on SIGINT/SIGTERM. On Windows, uses taskkill to tear down the process tree.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const backendDir = path.join(root, 'projects', 'blockd-backend');
const frontendDir = path.join(root, 'projects', 'blockd-frontend');

const BACKEND_PORT = process.env.BLOCKD_BACKEND_PORT ?? '8000';
const FRONTEND_PORT = process.env.BLOCKD_FRONTEND_PORT ?? '5173';

function killProcessTree(pid) {
  if (!pid || pid === process.pid) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    killer.on('error', () => {});
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    /* ignore */
  }
}

const backendEnv = {
  ...process.env,
  PYTHONUNBUFFERED: '1',
};

const backend = spawn(
  process.platform === 'win32' ? 'python' : 'python3',
  ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', BACKEND_PORT],
  {
    cwd: backendDir,
    env: backendEnv,
    stdio: 'inherit',
    shell: false,
  },
);

const frontend = spawn(
  'npm',
  ['run', 'dev', '--', '--host', '0.0.0.0', '--port', FRONTEND_PORT],
  {
    cwd: frontendDir,
    env: { ...process.env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[run-dev] Stopping (${signal})…`);
  killProcessTree(backend.pid);
  killProcessTree(frontend.pid);
  setTimeout(() => process.exit(0), 750);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

backend.on('exit', (code, sig) => {
  if (!shuttingDown && code !== 0) {
    console.error(`[run-dev] Backend exited (${code ?? sig}); stopping frontend.`);
    killProcessTree(frontend.pid);
    process.exit(code ?? 1);
  }
});

frontend.on('exit', (code, sig) => {
  if (!shuttingDown && code !== 0) {
    console.error(`[run-dev] Frontend exited (${code ?? sig}); stopping backend.`);
    killProcessTree(backend.pid);
    process.exit(code ?? 1);
  }
});

console.log('[run-dev] Backend:  http://localhost:' + BACKEND_PORT);
console.log('[run-dev] Frontend: http://localhost:' + FRONTEND_PORT);
console.log('[run-dev] Press Ctrl+C to stop both.\n');
