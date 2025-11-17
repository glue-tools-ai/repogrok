export function generateXml({ rootDir, files, directoryTree, gitDiff, gitLog, instruction, headerText, totalFiles, totalCharacters }) {
  let output = `<?xml version="1.0" encoding="UTF-8"?>\n<repogrok>\n`;

  // File summary
  output += `<file_summary>\n`;
  output += `This file is a packed representation of the repository at: ${rootDir}\n`;
  output += `It contains ${totalFiles} files with ${totalCharacters.toLocaleString()} total characters.\n\n`;
  output += `File Format:\n`;
  output += `The content is organized as follows:\n`;
  output += `1. A file summary (this section)\n`;
  output += `2. Repository directory structure\n`;
  output += `3. Full contents of each file\n`;
  output += `4. Git information (if included)\n`;
  output += `5. Instructions for the AI assistant\n\n`;
  output += `Usage:\n`;
  output += `This file should be used as context for AI-powered analysis, code review, refactoring, or documentation tasks.\n`;
  output += `</file_summary>\n\n`;

  // Header
  if (headerText) {
    output += `<user_provided_header>\n${headerText}\n</user_provided_header>\n\n`;
  }

  // Directory structure
  output += `<directory_structure>\n${directoryTree}</directory_structure>\n\n`;

  // Files
  output += `<files>\n`;
  for (const file of files) {
    output += `<file path="${escapeXml(file.path)}">\n${file.content}\n</file>\n\n`;
  }
  output += `</files>\n`;

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
