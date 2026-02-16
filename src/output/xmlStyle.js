export function generateXml({ rootDir, files, directoryTree, gitDiff, gitLog, instruction, headerText, totalFiles, totalCharacters, languageStats, dependencyGraph, importanceRanking }) {
  let output = `<?xml version="1.0" encoding="UTF-8"?>\n<repogrok>\n`;

  // File summary
  output += `<file_summary>\n`;
  output += `This file is a packed representation of the repository at: ${rootDir}\n`;
  output += `It contains ${totalFiles} files with ${totalCharacters.toLocaleString()} total characters.\n\n`;
  output += `File Format:\n`;
  output += `The content is organized as follows:\n`;
  output += `1. A file summary (this section)\n`;
  output += `2. Repository directory structure\n`;
  output += `3. Language statistics (if included)\n`;
  output += `4. Full contents of each file\n`;
  output += `5. Dependency graph (if included)\n`;
  output += `6. File importance ranking (if included)\n`;
  output += `7. Git information (if included)\n`;
  output += `8. Instructions for the AI assistant\n\n`;
  output += `Usage:\n`;
  output += `This file should be used as context for AI-powered analysis, code review, refactoring, or documentation tasks.\n`;
  output += `</file_summary>\n\n`;

  // Header
  if (headerText) {
    output += `<user_provided_header>\n${headerText}\n</user_provided_header>\n\n`;
  }

  // Directory structure
  output += `<directory_structure>\n${directoryTree}</directory_structure>\n\n`;

  // Language statistics
  if (languageStats && languageStats.length > 0) {
    output += `<language_statistics>\n`;
    for (const stat of languageStats) {
      output += `<language name="${escapeXml(stat.language)}" files="${stat.files}" lines="${stat.lines}" characters="${stat.characters}" percentage="${stat.percentage}%" />\n`;
    }
    output += `</language_statistics>\n\n`;
  }

  // Files
  output += `<files>\n`;
  for (const file of files) {
    output += `<file path="${escapeXml(file.path)}">\n${file.content}\n</file>\n\n`;
  }
  output += `</files>\n`;

  // Dependency graph
  if (dependencyGraph) {
    output += `\n<dependency_graph>\n${dependencyGraph}</dependency_graph>\n`;
  }

  // Importance ranking
  if (importanceRanking && importanceRanking.length > 0) {
    output += `\n<importance_ranking>\n`;
    for (const item of importanceRanking) {
      output += `<file path="${escapeXml(item.path)}" imported_by="${item.importedBy}" />\n`;
    }
    output += `</importance_ranking>\n`;
  }

  // Git diff
  if (gitDiff) {
    output += `\n<git_diffs>\n${gitDiff}\n</git_diffs>\n`;
  }

  // Git log
  if (gitLog) {
    output += `\n<git_logs>\n${gitLog}\n</git_logs>\n`;
  }

  // Instruction
  if (instruction) {
    output += `\n<instruction>\n${instruction}\n</instruction>\n`;
  }

  output += `</repogrok>\n`;
  return output;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
