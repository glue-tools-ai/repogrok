import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function getGitDiff(rootDir) {
  try {
    const workingDiff = execSync('git diff', { cwd: rootDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const stagedDiff = execSync('git diff --cached', { cwd: rootDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

    let result = '';
    if (workingDiff.trim()) result += `Working Tree Changes:\n${workingDiff}\n`;
    if (stagedDiff.trim()) result += `Staged Changes:\n${stagedDiff}\n`;
    return result || null;
  } catch {
    return null;
  }
}

export async function getGitLog(rootDir, count = 50) {
  try {
    const log = execSync(
      `git log --pretty=format:"%ad | %s" --date=short -n ${count}`,
      { cwd: rootDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return log || null;
  } catch {
    return null;
  }
}

export async function getDiffFiles(rootDir) {
  try {
    const output = execSync('git diff --name-only HEAD', { cwd: rootDir, encoding: 'utf-8' });
    const staged = execSync('git diff --cached --name-only', { cwd: rootDir, encoding: 'utf-8' });
    const untracked = execSync('git ls-files --others --exclude-standard', { cwd: rootDir, encoding: 'utf-8' });

    const allFiles = new Set([
      ...output.trim().split('\n').filter(Boolean),
      ...staged.trim().split('\n').filter(Boolean),
      ...untracked.trim().split('\n').filter(Boolean),
    ]);

    return [...allFiles];
  } catch {
    return [];
  }
}

export async function cloneRemote(url, branch) {
  const tmpDir = path.join(os.tmpdir(), `repogrok-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  let cloneCmd = `git clone --depth 1`;
  if (branch) cloneCmd += ` --branch ${branch}`;
  cloneCmd += ` ${url} ${tmpDir}`;

  execSync(cloneCmd, { encoding: 'utf-8', stdio: 'pipe' });

  return tmpDir;
}
