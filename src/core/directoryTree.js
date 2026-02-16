export function buildDirectoryTree(filePaths) {
  const tree = {};

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    let current = tree;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  return renderTree(tree, '', true);
}

function renderTree(node, prefix, isRoot) {
  let result = '';
  const entries = Object.entries(node);

  entries.forEach(([name, children], index) => {
    const isLast = index === entries.length - 1;
    const connector = isRoot ? '' : (isLast ? '└── ' : '├── ');
    const childPrefix = isRoot ? '' : (isLast ? '    ' : '│   ');

    result += `${prefix}${connector}${name}\n`;

    if (Object.keys(children).length > 0) {
      result += renderTree(children, prefix + childPrefix, false);
    }
  });

  return result;
}
