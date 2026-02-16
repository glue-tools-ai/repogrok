export function generatePlain({ rootDir, files, directoryTree, gitDiff, gitLog, instruction, headerText, totalFiles, totalCharacters }) {
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

  output += `================================================================\n`;
  output += `Files\n`;
  output += `================================================================\n\n`;

  for (const file of files) {
    output += `--- ${file.path} ---\n`;
    output += file.content + '\n\n';
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
