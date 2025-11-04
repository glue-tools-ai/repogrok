import stripComments from 'strip-comments';

export function processFiles(files, config) {
  return files.map(file => {
    let content = file.content;

    if (config.output.removeComments) {
      try {
        content = stripComments(content);
      } catch {
        // Keep original if stripping fails
      }
    }

    if (config.output.removeEmptyLines) {
      content = content.split('\n').filter(line => line.trim() !== '').join('\n');
    }

    if (config.output.showLineNumbers) {
      const lines = content.split('\n');
      content = lines.map((line, i) => `${String(i + 1).padStart(4)} | ${line}`).join('\n');
    }

    return { path: file.path, content };
  });
}
