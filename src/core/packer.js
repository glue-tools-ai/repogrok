import { searchFiles } from './fileSearch.js';
import { collectFiles } from './fileCollect.js';
import { processFiles } from './fileProcess.js';
import { generateOutput } from '../output/generator.js';
import { countTokens, estimateCost } from './tokenCount.js';
import { buildDirectoryTree } from './directoryTree.js';
import { getGitDiff, getGitLog } from './gitOps.js';
import { scanForSecrets } from './security.js';
import { loadConfig } from '../config/loader.js';
import { optimizeForBudget, parseBudget } from './budgetOptimizer.js';
import { calculateLanguageStats } from './languageStats.js';
import { rankFilesByImportance } from './importanceRanker.js';
import { buildDependencyGraph, formatDependencyGraph } from './dependencyGraph.js';
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
  let processedFiles = processFiles(safeFiles, config);

  // Step 6: Budget optimization (if --budget is specified)
  let budgetResult = null;
  if (options.budget) {
    const budgetTokens = parseBudget(options.budget);
    budgetResult = optimizeForBudget(processedFiles, budgetTokens);
    processedFiles = budgetResult.selected;
  }

  // Step 7: Language statistics
  const languageStats = calculateLanguageStats(processedFiles);

  // Step 8: Importance ranking
  const importanceRanking = rankFilesByImportance(processedFiles);

  // Step 9: Dependency graph
  const dependencyGraph = buildDependencyGraph(processedFiles);
  const dependencyGraphFormatted = options.deps ? formatDependencyGraph(dependencyGraph) : null;

  // Step 10: Build directory tree
  const currentFilePaths = processedFiles.map(f => f.path);
  const directoryTree = buildDirectoryTree(currentFilePaths);

  // Step 11: Apply custom instruction from --instruction flag
  if (options.instruction) {
    config.output.instruction = options.instruction;
  }

  // Step 12: Generate output
  const output = generateOutput({
    rootDir,
    files: processedFiles,
    directoryTree,
    gitDiff,
    gitLog,
    config,
    languageStats,
    dependencyGraph: dependencyGraphFormatted,
    importanceRanking: options.top ? importanceRanking.slice(0, parseInt(options.top, 10)) : null,
  });

  // Step 13: Token counting + cost
  const tokenResult = countTokens(output);
  const costEstimate = estimateCost(tokenResult.totalTokens);

  // Step 14: Write output
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
    languageStats,
    importanceRanking,
    dependencyGraph,
    budgetResult,
  };
}
