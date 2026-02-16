// Simple token estimation (4 chars per token average)
// This avoids the heavy tiktoken dependency for initial release

const CHARS_PER_TOKEN = 4;

const COST_TABLE = {
  'claude-sonnet-4': { input: 3.00, output: 15.00, contextWindow: '200K' },
  'claude-haiku-4': { input: 0.80, output: 4.00, contextWindow: '200K' },
  'gpt-4o': { input: 2.50, output: 10.00, contextWindow: '128K' },
  'gpt-4o-mini': { input: 0.15, output: 0.60, contextWindow: '128K' },
  'gemini-2.0-flash': { input: 0.10, output: 0.40, contextWindow: '1M' },
  'deepseek-v3': { input: 0.27, output: 1.10, contextWindow: '64K' },
};

export function countTokens(content) {
  const totalTokens = Math.ceil(content.length / CHARS_PER_TOKEN);
  return { totalTokens, totalCharacters: content.length };
}

export function countFileTokens(files) {
  const fileTokenCounts = [];
  let totalTokens = 0;

  for (const file of files) {
    const tokens = Math.ceil(file.content.length / CHARS_PER_TOKEN);
    totalTokens += tokens;
    fileTokenCounts.push({ path: file.path, tokens });
  }

  return { totalTokens, fileTokenCounts };
}

export function estimateCost(tokenCount) {
  const costs = {};

  for (const [model, pricing] of Object.entries(COST_TABLE)) {
    const inputCost = (tokenCount / 1_000_000) * pricing.input;
    costs[model] = {
      estimatedCost: `$${inputCost.toFixed(4)}`,
      contextWindow: pricing.contextWindow,
      fitsInContext: tokenCount <= parseContextWindow(pricing.contextWindow),
    };
  }

  return costs;
}

function parseContextWindow(str) {
  const num = parseFloat(str);
  if (str.includes('M')) return num * 1_000_000;
  if (str.includes('K')) return num * 1_000;
  return num;
}
