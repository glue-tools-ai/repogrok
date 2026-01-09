/**
 * Language Statistics
 * Analyzes files and produces a breakdown by programming language.
 */

const LANGUAGE_MAP = {
  js: 'JavaScript',
  jsx: 'JavaScript (JSX)',
  ts: 'TypeScript',
  tsx: 'TypeScript (TSX)',
  mjs: 'JavaScript (ESM)',
  cjs: 'JavaScript (CJS)',
  py: 'Python',
  rb: 'Ruby',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  cc: 'C++',
  cxx: 'C++',
  h: 'C/C++ Header',
  hpp: 'C++ Header',
  cs: 'C#',
  swift: 'Swift',
  kt: 'Kotlin',
  kts: 'Kotlin Script',
  php: 'PHP',
  r: 'R',
  scala: 'Scala',
  dart: 'Dart',
  lua: 'Lua',
  zig: 'Zig',
  nim: 'Nim',
  ex: 'Elixir',
  exs: 'Elixir',
  erl: 'Erlang',
  hs: 'Haskell',
  ml: 'OCaml',
  clj: 'Clojure',
  vue: 'Vue',
  svelte: 'Svelte',
  astro: 'Astro',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  less: 'LESS',
  sass: 'Sass',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  xml: 'XML',
  md: 'Markdown',
  mdx: 'MDX',
  txt: 'Text',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  fish: 'Fish',
  ps1: 'PowerShell',
  bat: 'Batch',
  sql: 'SQL',
  graphql: 'GraphQL',
  gql: 'GraphQL',
  proto: 'Protocol Buffers',
  dockerfile: 'Dockerfile',
  makefile: 'Makefile',
  cmake: 'CMake',
  tf: 'Terraform',
  hcl: 'HCL',
};

export function calculateLanguageStats(files) {
  const stats = {};

  for (const file of files) {
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    const basename = file.path.split('/').pop()?.toLowerCase() || '';
    const lang = LANGUAGE_MAP[ext] || LANGUAGE_MAP[basename] || 'Other';

    if (!stats[lang]) {
      stats[lang] = { files: 0, lines: 0, characters: 0 };
    }

    stats[lang].files++;
    stats[lang].lines += file.content.split('\n').length;
    stats[lang].characters += file.content.length;
  }

  // Calculate total for percentages
  const totalLines = Object.values(stats).reduce((sum, s) => sum + s.lines, 0);

  // Sort by lines descending
  return Object.entries(stats)
    .sort(([, a], [, b]) => b.lines - a.lines)
    .map(([language, data]) => ({
      language,
      ...data,
      percentage: totalLines > 0 ? ((data.lines / totalLines) * 100).toFixed(1) : '0.0',
    }));
}

export function formatLanguageStats(stats) {
  if (stats.length === 0) return 'No files analyzed.\n';

  const maxLangLen = Math.max(...stats.map(s => s.language.length), 8);
  let output = 'Language'.padEnd(maxLangLen + 2) + 'Files'.padStart(6) + 'Lines'.padStart(10) + '     %\n';
  output += '-'.repeat(maxLangLen + 2 + 6 + 10 + 6) + '\n';

  for (const s of stats) {
    output += s.language.padEnd(maxLangLen + 2);
    output += String(s.files).padStart(6);
    output += String(s.lines).padStart(10);
    output += (s.percentage + '%').padStart(6);
    output += '\n';
  }

  return output;
}
