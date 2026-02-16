import fs from 'fs/promises';
import path from 'path';

const DEFAULT_CONFIG = {
  include: [],
  ignore: {
    useGitignore: true,
    useDotIgnore: true,
    useDefaultPatterns: true,
    customPatterns: [],
  },
  output: {
    filePath: 'repogrok-output.xml',
    style: 'xml',
    showLineNumbers: false,
    removeComments: false,
    removeEmptyLines: false,
    headerText: null,
    instruction: null,
    git: {
      includeDiffs: false,
      includeLogs: false,
      includeLogsCount: 50,
    },
  },
  security: {
    enableSecurityCheck: true,
  },
  prompt: null,
};

export async function loadConfig(targetPath, cliOptions = {}) {
  const rootDir = path.resolve(targetPath || '.');
  let fileConfig = {};

  // Try to load config file
  const configPath = path.join(rootDir, 'repogrok.config.json');
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    fileConfig = JSON.parse(raw);
  } catch {
    // No config file, use defaults
  }

  // Deep merge: defaults <- fileConfig <- cliOptions
  const config = deepMerge(DEFAULT_CONFIG, fileConfig);

  // Apply CLI overrides
  if (cliOptions.output) config.output.filePath = cliOptions.output;
  if (cliOptions.style) config.output.style = cliOptions.style;
  if (cliOptions.include) config.include = cliOptions.include.split(',').map(s => s.trim());
  if (cliOptions.ignore) config.ignore.customPatterns = cliOptions.ignore.split(',').map(s => s.trim());
  if (cliOptions.lineNumbers) config.output.showLineNumbers = true;
  if (cliOptions.removeComments) config.output.removeComments = true;
  if (cliOptions.removeEmptyLines) config.output.removeEmptyLines = true;
  if (cliOptions.diff) config.output.git.includeDiffs = true;
  if (cliOptions.includeLogs) {
    config.output.git.includeLogs = true;
    if (typeof cliOptions.includeLogs === 'number') {
      config.output.git.includeLogsCount = cliOptions.includeLogs;
    }
  }
  if (cliOptions.prompt) config.prompt = cliOptions.prompt;
  if (cliOptions.noSecurity) config.security.enableSecurityCheck = false;

  return config;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
