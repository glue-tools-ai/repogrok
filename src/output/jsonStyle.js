export function generateJson({ rootDir, files, directoryTree, gitDiff, gitLog, instruction, totalFiles, totalCharacters }) {
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

  if (gitDiff) data.gitDiffs = gitDiff;
  if (gitLog) data.gitLogs = gitLog;
  if (instruction) data.instruction = instruction;

  return JSON.stringify(data, null, 2);
}
