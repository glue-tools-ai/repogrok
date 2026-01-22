export function generateJson({ rootDir, files, directoryTree, gitDiff, gitLog, instruction, totalFiles, totalCharacters, languageStats, dependencyGraph, importanceRanking }) {
  const data = {
    summary: {
      repository: rootDir,
      totalFiles,
      totalCharacters,
      generatedBy: 'repogrok',
      generatedAt: new Date().toISOString(),
    },
    directoryStructure: directoryTree,
    files: Object.fromEntries(files.map(f => [f.path, f.content])),
  };

  if (languageStats && languageStats.length > 0) {
    data.languageStatistics = languageStats;
  }

  if (dependencyGraph) {
    data.dependencyGraph = dependencyGraph;
  }

  if (importanceRanking && importanceRanking.length > 0) {
    data.importanceRanking = importanceRanking;
  }

  if (gitDiff) data.gitDiffs = gitDiff;
  if (gitLog) data.gitLogs = gitLog;
  if (instruction) data.instruction = instruction;

  return JSON.stringify(data, null, 2);
}
