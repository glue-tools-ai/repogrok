import { describe, it } from 'node:test';
import assert from 'assert';
import { pack } from '../src/core/packer.js';
import { searchFiles } from '../src/core/fileSearch.js';
import { buildDirectoryTree } from '../src/core/directoryTree.js';
import { countTokens, estimateCost } from '../src/core/tokenCount.js';
import { getPromptTemplate, listPromptTemplates } from '../src/prompts/templates.js';
import { loadConfig } from '../src/config/loader.js';
import fs from 'fs/promises';

describe('repogrok', () => {
  it('should pack current directory', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-output.xml' });
    assert.ok(result.totalFiles > 0, 'Should find files');
    assert.ok(result.totalTokens > 0, 'Should count tokens');
    assert.ok(result.outputPath, 'Should have output path');

    const content = await fs.readFile(result.outputPath, 'utf-8');
    assert.ok(content.includes('<repogrok>'), 'Should generate XML');
    assert.ok(content.includes('package.json'), 'Should include package.json');

    // Cleanup
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should search files', async () => {
    const config = await loadConfig('.');
    const files = await searchFiles('.', config);
    assert.ok(files.length > 0, 'Should find files');
    assert.ok(files.includes('package.json'), 'Should find package.json');
  });

  it('should build directory tree', () => {
    const tree = buildDirectoryTree(['src/index.js', 'src/core/packer.js', 'package.json']);
    assert.ok(tree.includes('src'), 'Tree should contain src');
    assert.ok(tree.includes('package.json'), 'Tree should contain package.json');
  });

  it('should count tokens', () => {
    const result = countTokens('Hello world, this is a test string.');
    assert.ok(result.totalTokens > 0, 'Should count tokens');
    assert.ok(result.totalCharacters > 0, 'Should count characters');
  });

  it('should estimate costs', () => {
    const costs = estimateCost(10000);
    assert.ok(costs['claude-sonnet-4'], 'Should have Claude cost');
    assert.ok(costs['gpt-4o'], 'Should have GPT-4o cost');
    assert.ok(costs['gemini-2.0-flash'], 'Should have Gemini cost');
    assert.ok(costs['claude-sonnet-4'].estimatedCost.startsWith('$'), 'Cost should start with $');
  });

  it('should have prompt templates', () => {
    const templates = listPromptTemplates();
    assert.ok(templates.includes('code-review'), 'Should have code-review');
    assert.ok(templates.includes('refactor'), 'Should have refactor');
    assert.ok(templates.includes('security'), 'Should have security');

    const template = getPromptTemplate('code-review');
    assert.ok(template.includes('review'), 'Template should contain review instructions');
  });

  it('should throw for unknown prompt template', () => {
    assert.throws(() => getPromptTemplate('nonexistent'), /Unknown prompt template/);
  });

  it('should generate markdown output', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-md.md', style: 'markdown' });
    const content = await fs.readFile(result.outputPath, 'utf-8');
    assert.ok(content.includes('# Repository Pack'), 'Should be markdown');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should generate JSON output', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-json.json', style: 'json' });
    const content = await fs.readFile(result.outputPath, 'utf-8');
    const parsed = JSON.parse(content);
    assert.ok(parsed.summary, 'Should have summary');
    assert.ok(parsed.files, 'Should have files');
    await fs.unlink(result.outputPath).catch(() => {});
  });
});
