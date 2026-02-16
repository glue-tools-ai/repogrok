import { searchFiles } from './fileSearch.js';
import { collectFiles } from './fileCollect.js';
import { processFiles } from './fileProcess.js';
import { generateOutput } from '../output/generator.js';
import { countTokens, estimateCost } from './tokenCount.js';
import { buildDirectoryTree } from './directoryTree.js';
import { getGitDiff, getGitLog } from './gitOps.js';
import { scanForSecrets } from './security.js';
import { loadConfig } from '../config/loader.js';
import fs from 'fs/promises';
import path from 'path';

export async function pack(targetPath, options = {}) {
  const config = await loadConfig(targetPath, options);
  const rootDir = path.resolve(targetPath || '.');

  // Step 1: Search files
  const filePaths = await searchFiles(rootDir, config);

  // Step 2: Collect file contents
  const rawFiles = await collectFiles(filePaths, rootDir);

  // Step 3: Security scan
  const { safeFiles, suspiciousFiles } = await scanForSecrets(rawFiles, config);

  // Step 4: Git operations
  let gitDiff = null;
  let gitLog = null;
  if (config.output.git.includeDiffs) {
    gitDiff = await getGitDiff(rootDir);
  }
  if (config.output.git.includeLogs) {
    gitLog = await getGitLog(rootDir, config.output.git.includeLogsCount);
  }

  // Step 5: Process files
  const processedFiles = processFiles(safeFiles, config);

  // Step 6: Build directory tree
  const directoryTree = buildDirectoryTree(filePaths);

  // Step 7: Generate output
  const output = generateOutput({
    rootDir,
    files: processedFiles,
    directoryTree,
    gitDiff,
    gitLog,
    config,
  });

  // Step 8: Token counting + cost
  const tokenResult = countTokens(output);
  const costEstimate = estimateCost(tokenResult.totalTokens);

  // Step 9: Write output
  const outputPath = path.resolve(config.output.filePath);
  await fs.writeFile(outputPath, output, 'utf-8');

  return {
    outputPath,
    totalFiles: processedFiles.length,
    totalCharacters: output.length,
    totalTokens: tokenResult.totalTokens,
    fileTokenCounts: tokenResult.fileTokenCounts,
    costEstimate,
    suspiciousFiles,
  };
}
