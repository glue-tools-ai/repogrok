/**
 * Dependency Graph Builder
 * Builds and formats a dependency graph showing import relationships between files.
 */

export function buildDependencyGraph(files) {
  const graph = {};

  for (const file of files) {
    graph[file.path] = [];

    const importPatterns = [
      /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(file.content)) !== null) {
        const imported = match[1];
        // Only track local imports (starting with . or /)
        if (imported.startsWith('.') || imported.startsWith('/')) {
          // Try to resolve to a known file
          const resolved = files.find(
            f =>
              f.path.includes(imported.replace(/^\.\//, '')) ||
              f.path
                .replace(/\.[^.]+$/, '')
                .endsWith(imported.replace(/^\.\//, '').replace(/\.[^.]+$/, ''))
          );
          if (resolved) {
            graph[file.path].push(resolved.path);
          } else {
            graph[file.path].push(imported + ' (unresolved)');
          }
        }
      }
    }
  }

  return graph;
}

export function formatDependencyGraph(graph) {
  let output = '';
  const entries = Object.entries(graph).filter(([, deps]) => deps.length > 0);

  if (entries.length === 0) {
    return 'No local dependencies detected.\n';
  }

  for (const [file, deps] of entries) {
    output += `${file}\n`;
    deps.forEach((dep, i) => {
      const connector = i === deps.length - 1 ? '  \\-- ' : '  |-- ';
      output += `${connector}${dep}\n`;
    });
  }

  return output;
}
