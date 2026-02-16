import fs from 'fs/promises';
import path from 'path';
import { isBinaryFile } from 'isbinaryfile';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function collectFiles(filePaths, rootDir) {
  const files = [];

  for (const filePath of filePaths) {
    const absolutePath = path.join(rootDir, filePath);

    try {
      const stat = await fs.stat(absolutePath);

      if (stat.size > MAX_FILE_SIZE) {
        continue;
      }

      const buffer = await fs.readFile(absolutePath);

      if (await isBinaryFile(buffer)) {
        continue;
      }

      const content = buffer.toString('utf-8');
      files.push({ path: filePath, content });
    } catch {
      // Skip files that can't be read
    }
  }

  return files;
}
