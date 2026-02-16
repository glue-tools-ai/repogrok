import { globby } from 'globby';
import path from 'path';
import fs from 'fs/promises';

const DEFAULT_IGNORE = [
  'node_modules/**', '.git/**', '.svn/**', '.hg/**',
  'dist/**', 'build/**', 'out/**', '.next/**', '.nuxt/**',
  'coverage/**', '.nyc_output/**',
  '*.min.js', '*.min.css', '*.map',
  '*.lock', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.env', '.env.*',
  '*.png', '*.jpg', '*.jpeg', '*.gif', '*.ico', '*.svg', '*.webp',
  '*.woff', '*.woff2', '*.ttf', '*.eot',
  '*.mp3', '*.mp4', '*.avi', '*.mov',
  '*.zip', '*.tar', '*.gz', '*.rar',
  '*.pdf', '*.doc', '*.docx', '*.xls', '*.xlsx',
  '*.exe', '*.dll', '*.so', '*.dylib',
  '*.pyc', '*.pyo', '__pycache__/**',
  '.DS_Store', 'Thumbs.db',
  '.idea/**', '.vscode/**', '*.swp', '*.swo',
  'repogrok-output.*',
];

export async function searchFiles(rootDir, config) {
  const includePatterns = config.include.length > 0 ? config.include : ['**/*'];

  const ignorePatterns = [...DEFAULT_IGNORE];

  if (config.ignore.useDefaultPatterns) {
    // already included above
  }

  if (config.ignore.customPatterns) {
    ignorePatterns.push(...config.ignore.customPatterns);
  }

  // Check for .repogrokignore
  try {
    const ignoreFile = await fs.readFile(path.join(rootDir, '.repogrokignore'), 'utf-8');
    const lines = ignoreFile.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    ignorePatterns.push(...lines);
  } catch {}

  const files = await globby(includePatterns, {
    cwd: rootDir,
    ignore: ignorePatterns,
    gitignore: config.ignore.useGitignore,
    dot: false,
    onlyFiles: true,
    absolute: false,
  });

  return files.sort();
}
