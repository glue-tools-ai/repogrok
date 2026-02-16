export function generatePlain({ rootDir, files, directoryTree, gitDiff, gitLog, instruction, headerText, totalFiles, totalCharacters, languageStats, dependencyGraph, importanceRanking }) {
  let output = `================================================================\n`;
  output += `Repository Pack\n`;
  output += `================================================================\n\n`;

  output += `Repository: ${rootDir}\n`;
  output += `Total Files: ${totalFiles}\n`;
  output += `Total Characters: ${totalCharacters.toLocaleString()}\n\n`;

  if (headerText) {
    output += `--- Notes ---\n${headerText}\n\n`;
  }

  output += `================================================================\n`;
  output += `Directory Structure\n`;
  output += `================================================================\n\n`;
  output += directoryTree + '\n';

  // Language statistics
  if (languageStats && languageStats.length > 0) {
    output += `================================================================\n`;
    output += `Language Statistics\n`;
    output += `================================================================\n\n`;
    const maxLangLen = Math.max(...languageStats.map(s => s.language.length), 8);
    output += 'Language'.padEnd(maxLangLen + 2) + 'Files'.padStart(6) + 'Lines'.padStart(10) + '     %\n';
    output += '-'.repeat(maxLangLen + 2 + 6 + 10 + 6) + '\n';
    for (const s of languageStats) {
      output += s.language.padEnd(maxLangLen + 2);
      output += String(s.files).padStart(6);
      output += String(s.lines).padStart(10);
      output += (s.percentage + '%').padStart(6);
      output += '\n';
    }
    output += '\n';
  }

  output += `================================================================\n`;
  output += `Files\n`;
  output += `================================================================\n\n`;

  for (const file of files) {
    output += `--- ${file.path} ---\n`;
    output += file.content + '\n\n';
  }

  // Dependency graph
  if (dependencyGraph) {
    output += `================================================================\n`;
    output += `Dependency Graph\n`;
    output += `================================================================\n\n`;
    output += dependencyGraph + '\n';
  }

  // Importance ranking
  if (importanceRanking && importanceRanking.length > 0) {
    output += `================================================================\n`;
    output += `Most Imported Files\n`;
    output += `================================================================\n\n`;
    for (const item of importanceRanking) {
      output += `${item.path} - imported by ${item.importedBy} file(s)\n`;
    }
    output += '\n';
  }

  if (gitDiff) {
    output += `================================================================\n`;
    output += `Git Diffs\n`;
    output += `================================================================\n\n`;
    output += gitDiff + '\n';
  }

  if (gitLog) {
    output += `================================================================\n`;
    output += `Git Log\n`;
    output += `================================================================\n\n`;
    output += gitLog + '\n';
  }

  if (instruction) {
    output += `================================================================\n`;
    output += `Instruction\n`;
    output += `================================================================\n\n`;
    output += instruction + '\n';
  }

  return output;
}
