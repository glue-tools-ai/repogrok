/**
 * Context Budget Optimizer
 * Given a token budget, ranks files by importance and selects only files that fit.
 */

export function optimizeForBudget(files, budgetTokens) {
  // Score each file
  const scored = files.map(f => ({
    ...f,
    tokens: Math.ceil(f.content.length / 4),
    score: scoreFile(f),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Greedily select files until budget exhausted
  const selected = [];
  let usedTokens = 0;
  for (const file of scored) {
    if (usedTokens + file.tokens <= budgetTokens) {
      selected.push(file);
      usedTokens += file.tokens;
    }
  }

  return {
    selected,
    usedTokens,
    totalTokens: scored.reduce((s, f) => s + f.tokens, 0),
    droppedFiles: scored.length - selected.length,
  };
}

function scoreFile(file) {
  const p = file.path.toLowerCase();
  let score = 0;

  // Manifest files
  if (
    p === 'package.json' ||
    p === 'cargo.toml' ||
    p === 'pyproject.toml' ||
    p === 'go.mod' ||
    p === 'gemfile' ||
    p === 'requirements.txt' ||
    p === 'pom.xml' ||
    p === 'build.gradle'
  ) {
    score += 100;
  }

  // Config files
  if (p.includes('config') || p.includes('.env.example')) score += 50;

  // README
  if (p.includes('readme')) score += 80;

  // Entry points
  if (/^(src\/)?(index|main|app|server)\.[jt]sx?$/.test(p)) score += 90;

  // Source files preferred over tests
  if (p.includes('test') || p.includes('spec') || p.includes('__test')) score -= 20;

  // Smaller files are cheaper to include
  score += Math.max(0, 30 - Math.floor(file.content.length / 1000));

  // Source files
  if (p.startsWith('src/') || p.startsWith('lib/')) score += 20;

  return score;
}

/**
 * Parse a budget string like "128k", "200k", "1m", "1M", or a plain number.
 * Returns the number of tokens.
 */
export function parseBudget(budgetStr) {
  const str = String(budgetStr).trim().toLowerCase();
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(k|m)?$/);
  if (!match) {
    throw new Error(`Invalid budget format: "${budgetStr}". Use a number like 128000, or shorthand like "128k" or "1m".`);
  }
  const num = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === 'k') return Math.floor(num * 1000);
  if (suffix === 'm') return Math.floor(num * 1000000);
  return Math.floor(num);
}
