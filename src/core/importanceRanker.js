/**
 * File Importance Ranker
 * Ranks files by how many other files import them.
 */

export function rankFilesByImportance(files) {
  // Count how many times each file is imported by other files
  const importCount = {};

  for (const file of files) {
    // Initialize
    if (!importCount[file.path]) importCount[file.path] = 0;

    // Find import/require references
    const importPatterns = [
      /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /from\s+['"]([^'"]+)['"]/g,
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(file.content)) !== null) {
        const imported = match[1];
        // Only track local imports
        if (!imported.startsWith('.') && !imported.startsWith('/')) continue;
        // Try to resolve to a file path
        for (const f of files) {
          if (
            f.path.includes(imported.replace(/^\.\//, '')) ||
            f.path.replace(/\.[^.]+$/, '').endsWith(imported.replace(/^\.\//, '').replace(/\.[^.]+$/, ''))
          ) {
            importCount[f.path] = (importCount[f.path] || 0) + 1;
          }
        }
      }
    }
  }

  return Object.entries(importCount)
    .sort(([, a], [, b]) => b - a)
    .map(([path, count]) => ({ path, importedBy: count }));
}

export function formatImportanceRanking(ranking, topN) {
  const items = topN ? ranking.slice(0, topN) : ranking.filter(r => r.importedBy > 0);

  if (items.length === 0) return 'No import relationships detected.\n';

  const maxPathLen = Math.max(...items.map(i => i.path.length), 4);
  let output = 'File'.padEnd(maxPathLen + 2) + 'Imported By\n';
  output += '-'.repeat(maxPathLen + 2 + 11) + '\n';

  for (const item of items) {
    output += item.path.padEnd(maxPathLen + 2);
    output += String(item.importedBy) + ' file(s)';
    output += '\n';
  }

  return output;
}
