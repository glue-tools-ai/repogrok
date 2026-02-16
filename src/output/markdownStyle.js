export function generateMarkdown({ rootDir, files, directoryTree, gitDiff, gitLog, instruction, headerText, totalFiles, totalCharacters, languageStats, dependencyGraph, importanceRanking }) {
  let output = `# Repository Pack\n\n`;

  // Summary
  output += `## File Summary\n\n`;
  output += `- **Repository**: ${rootDir}\n`;
  output += `- **Total Files**: ${totalFiles}\n`;
  output += `- **Total Characters**: ${totalCharacters.toLocaleString()}\n\n`;
  output += `This file contains a packed representation of the repository for AI analysis.\n\n`;

  // Header
  if (headerText) {
    output += `## Notes\n\n${headerText}\n\n`;
  }

  // Directory structure
  output += `## Directory Structure\n\n`;
  output += "```\n" + directoryTree + "```\n\n";

  // Language statistics
  if (languageStats && languageStats.length > 0) {
    output += `## Language Statistics\n\n`;
    output += '| Language | Files | Lines | % |\n';
    output += '|----------|------:|------:|--:|\n';
    for (const stat of languageStats) {
      output += `| ${stat.language} | ${stat.files} | ${stat.lines} | ${stat.percentage}% |\n`;
    }
    output += '\n';
  }

  // Files
  output += `## Files\n\n`;
  for (const file of files) {
    const ext = file.path.split('.').pop() || '';
    output += `### ${file.path}\n\n`;
    output += "```" + ext + "\n" + file.content + "\n```\n\n";
  }

  // Dependency graph
  if (dependencyGraph) {
    output += `## Dependency Graph\n\n`;
    output += "```\n" + dependencyGraph + "```\n\n";
  }

  // Importance ranking
  if (importanceRanking && importanceRanking.length > 0) {
    output += `## Most Imported Files\n\n`;
    output += '| File | Imported By |\n';
    output += '|------|------------:|\n';
    for (const item of importanceRanking) {
      output += `| ${item.path} | ${item.importedBy} |\n`;
    }
    output += '\n';
  }

  // Git diff
  if (gitDiff) {
    output += `## Git Diffs\n\n`;
    output += "```diff\n" + gitDiff + "\n```\n\n";
  }

  // Git log
  if (gitLog) {
    output += `## Git Log\n\n`;
    output += "```\n" + gitLog + "\n```\n\n";
  }

  // Instruction
  if (instruction) {
    output += `## Instruction\n\n${instruction}\n`;
  }

  return output;
}
