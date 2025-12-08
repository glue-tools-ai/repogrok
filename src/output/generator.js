import { generateXml } from './xmlStyle.js';
import { generateMarkdown } from './markdownStyle.js';
import { generateJson } from './jsonStyle.js';
import { generatePlain } from './plainStyle.js';
import { getPromptTemplate } from '../prompts/templates.js';

export function generateOutput({ rootDir, files, directoryTree, gitDiff, gitLog, config }) {
  const promptInstruction = config.prompt ? getPromptTemplate(config.prompt) : config.output.instruction || null;

  const data = {
    rootDir,
    files,
    directoryTree,
    gitDiff,
    gitLog,
    instruction: promptInstruction,
    headerText: config.output.headerText || null,
    totalFiles: files.length,
    totalCharacters: files.reduce((sum, f) => sum + f.content.length, 0),
  };

  switch (config.output.style) {
    case 'xml': return generateXml(data);
    case 'markdown': return generateMarkdown(data);
    case 'json': return generateJson(data);
    case 'plain': return generatePlain(data);
    default: return generateXml(data);
  }
}
