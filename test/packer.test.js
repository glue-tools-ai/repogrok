import { describe, it } from 'node:test';
import assert from 'assert';
import { pack } from '../src/core/packer.js';
import { searchFiles } from '../src/core/fileSearch.js';
import { buildDirectoryTree } from '../src/core/directoryTree.js';
import { countTokens, estimateCost } from '../src/core/tokenCount.js';
import { getPromptTemplate, listPromptTemplates } from '../src/prompts/templates.js';
import { loadConfig } from '../src/config/loader.js';
import { optimizeForBudget, parseBudget } from '../src/core/budgetOptimizer.js';
import { calculateLanguageStats, formatLanguageStats } from '../src/core/languageStats.js';
import { rankFilesByImportance, formatImportanceRanking } from '../src/core/importanceRanker.js';
import { buildDependencyGraph, formatDependencyGraph } from '../src/core/dependencyGraph.js';
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

  // --- New feature tests ---

  it('should optimize for budget', () => {
    const files = [
      { path: 'package.json', content: '{"name":"test"}' },
      { path: 'src/index.js', content: 'console.log("hello");' },
      { path: 'src/utils.js', content: 'export function add(a,b) { return a+b; }' },
      { path: 'test/test.js', content: 'assert(true);' },
      { path: 'README.md', content: '# Test Project\n\nA test project for testing.' },
    ];

    // Budget that can fit all files
    const resultAll = optimizeForBudget(files, 10000);
    assert.strictEqual(resultAll.selected.length, 5, 'Should select all files with large budget');
    assert.strictEqual(resultAll.droppedFiles, 0, 'Should drop no files');

    // Very small budget - should only fit some files
    const resultSmall = optimizeForBudget(files, 10);
    assert.ok(resultSmall.selected.length < 5, 'Should drop files with small budget');
    assert.ok(resultSmall.droppedFiles > 0, 'Should report dropped files');
    assert.ok(resultSmall.usedTokens <= 10, 'Should not exceed budget');
  });

  it('should parse budget strings', () => {
    assert.strictEqual(parseBudget('128k'), 128000, 'Should parse 128k');
    assert.strictEqual(parseBudget('1m'), 1000000, 'Should parse 1m');
    assert.strictEqual(parseBudget('200k'), 200000, 'Should parse 200k');
    assert.strictEqual(parseBudget('50000'), 50000, 'Should parse plain number');
    assert.strictEqual(parseBudget('1.5k'), 1500, 'Should parse 1.5k');
    assert.throws(() => parseBudget('abc'), /Invalid budget format/, 'Should throw for invalid format');
  });

  it('should prioritize important files in budget', () => {
    const files = [
      { path: 'package.json', content: 'x'.repeat(40) },  // 10 tokens, score 100+
      { path: 'src/index.js', content: 'x'.repeat(40) },  // 10 tokens, score 90+
      { path: 'test/big.test.js', content: 'x'.repeat(40) },  // 10 tokens, score -20+
    ];

    const result = optimizeForBudget(files, 20);
    assert.strictEqual(result.selected.length, 2, 'Should select exactly 2 files');
    const paths = result.selected.map(f => f.path);
    assert.ok(paths.includes('package.json'), 'Should include package.json');
    assert.ok(paths.includes('src/index.js'), 'Should include entry point');
  });

  it('should calculate language statistics', () => {
    const files = [
      { path: 'src/index.js', content: 'console.log("hello");\nconsole.log("world");' },
      { path: 'src/app.ts', content: 'const x: number = 1;\nconst y: number = 2;\nconst z: number = 3;' },
      { path: 'styles/main.css', content: 'body { margin: 0; }' },
      { path: 'README.md', content: '# Hello\n\nWorld' },
    ];

    const stats = calculateLanguageStats(files);
    assert.ok(stats.length > 0, 'Should have language stats');

    const jsStats = stats.find(s => s.language === 'JavaScript');
    assert.ok(jsStats, 'Should detect JavaScript');
    assert.strictEqual(jsStats.files, 1, 'Should count 1 JS file');
    assert.strictEqual(jsStats.lines, 2, 'Should count 2 JS lines');

    const tsStats = stats.find(s => s.language === 'TypeScript');
    assert.ok(tsStats, 'Should detect TypeScript');
    assert.strictEqual(tsStats.files, 1, 'Should count 1 TS file');
    assert.strictEqual(tsStats.lines, 3, 'Should count 3 TS lines');

    // Verify percentages exist
    for (const stat of stats) {
      assert.ok(stat.percentage !== undefined, 'Should have percentage');
    }
  });

  it('should format language statistics', () => {
    const stats = [
      { language: 'JavaScript', files: 10, lines: 500, characters: 12000, percentage: '55.0' },
      { language: 'TypeScript', files: 5, lines: 300, characters: 8000, percentage: '33.0' },
      { language: 'CSS', files: 2, lines: 100, characters: 2000, percentage: '11.0' },
    ];

    const formatted = formatLanguageStats(stats);
    assert.ok(formatted.includes('JavaScript'), 'Should include JavaScript');
    assert.ok(formatted.includes('TypeScript'), 'Should include TypeScript');
    assert.ok(formatted.includes('CSS'), 'Should include CSS');
    assert.ok(formatted.includes('500'), 'Should include line count');
  });

  it('should rank files by importance', () => {
    const files = [
      { path: 'src/utils.js', content: 'export function add(a,b) { return a+b; }' },
      { path: 'src/index.js', content: 'import { add } from "./utils.js";\nconsole.log(add(1,2));' },
      { path: 'src/app.js', content: 'import { add } from "./utils.js";\nimport { something } from "./index.js";' },
    ];

    const ranking = rankFilesByImportance(files);
    assert.ok(ranking.length > 0, 'Should produce ranking');

    // utils.js should be most imported (imported by both index.js and app.js)
    const utilsRank = ranking.find(r => r.path === 'src/utils.js');
    assert.ok(utilsRank, 'Should find utils.js in ranking');
    assert.ok(utilsRank.importedBy >= 2, 'utils.js should be imported by at least 2 files');
  });

  it('should format importance ranking', () => {
    const ranking = [
      { path: 'src/utils.js', importedBy: 5 },
      { path: 'src/index.js', importedBy: 3 },
      { path: 'src/app.js', importedBy: 0 },
    ];

    const formatted = formatImportanceRanking(ranking, 2);
    assert.ok(formatted.includes('src/utils.js'), 'Should include top file');
    assert.ok(formatted.includes('src/index.js'), 'Should include second file');

    const formattedNoResults = formatImportanceRanking([], 5);
    assert.ok(formattedNoResults.includes('No import relationships'), 'Should handle empty ranking');
  });

  it('should build dependency graph', () => {
    const files = [
      { path: 'src/index.js', content: 'import { foo } from "./utils.js";' },
      { path: 'src/utils.js', content: 'export function foo() {}' },
      { path: 'src/app.js', content: 'import { bar } from "./utils.js";\nimport { x } from "./index.js";' },
    ];

    const graph = buildDependencyGraph(files);
    assert.ok(graph['src/index.js'], 'Should have entry for index.js');
    assert.ok(graph['src/index.js'].length > 0, 'index.js should have dependencies');
    assert.ok(graph['src/app.js'].length >= 2, 'app.js should have at least 2 dependencies');
  });

  it('should format dependency graph', () => {
    const graph = {
      'src/index.js': ['src/utils.js'],
      'src/app.js': ['src/utils.js', 'src/index.js'],
      'src/utils.js': [],
    };

    const formatted = formatDependencyGraph(graph);
    assert.ok(formatted.includes('src/index.js'), 'Should include index.js');
    assert.ok(formatted.includes('src/utils.js'), 'Should include utils.js');
    assert.ok(formatted.includes('src/app.js'), 'Should include app.js');

    const emptyFormatted = formatDependencyGraph({ 'a.js': [], 'b.js': [] });
    assert.ok(emptyFormatted.includes('No local dependencies'), 'Should handle empty graph');
  });

  it('should include language stats in pack result', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-stats.xml' });
    assert.ok(result.languageStats, 'Should include languageStats in result');
    assert.ok(Array.isArray(result.languageStats), 'languageStats should be an array');
    assert.ok(result.languageStats.length > 0, 'Should have at least one language stat');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should include importance ranking in pack result', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-rank.xml' });
    assert.ok(result.importanceRanking, 'Should include importanceRanking in result');
    assert.ok(Array.isArray(result.importanceRanking), 'importanceRanking should be an array');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should include dependency graph in pack result', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-deps.xml' });
    assert.ok(result.dependencyGraph, 'Should include dependencyGraph in result');
    assert.ok(typeof result.dependencyGraph === 'object', 'dependencyGraph should be an object');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should pack with budget option', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-budget.xml', budget: '128k' });
    assert.ok(result.budgetResult, 'Should have budgetResult');
    assert.ok(result.budgetResult.usedTokens <= 128000, 'Should respect budget');
    assert.ok(result.budgetResult.selected.length > 0, 'Should select some files');
    assert.ok(result.totalFiles > 0, 'Should have files');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should pack with deps option and include graph in output', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-deps-output.xml', deps: true });
    const content = await fs.readFile(result.outputPath, 'utf-8');
    assert.ok(content.includes('dependency_graph') || content.includes('No local dependencies'), 'Should include dependency graph section');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should pack with custom instruction', async () => {
    const instruction = 'Please review this code for security vulnerabilities.';
    const result = await pack('.', { output: '/tmp/repogrok-test-instruction.xml', instruction });
    const content = await fs.readFile(result.outputPath, 'utf-8');
    assert.ok(content.includes(instruction), 'Should include custom instruction in output');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should include language stats in XML output', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-xml-stats.xml' });
    const content = await fs.readFile(result.outputPath, 'utf-8');
    assert.ok(content.includes('<language_statistics>'), 'XML should include language statistics section');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should include language stats in markdown output', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-md-stats.md', style: 'markdown' });
    const content = await fs.readFile(result.outputPath, 'utf-8');
    assert.ok(content.includes('## Language Statistics'), 'Markdown should include language statistics section');
    await fs.unlink(result.outputPath).catch(() => {});
  });

  it('should include language stats in JSON output', async () => {
    const result = await pack('.', { output: '/tmp/repogrok-test-json-stats.json', style: 'json' });
    const content = await fs.readFile(result.outputPath, 'utf-8');
    const parsed = JSON.parse(content);
    assert.ok(parsed.languageStatistics, 'JSON should include languageStatistics');
    assert.ok(Array.isArray(parsed.languageStatistics), 'languageStatistics should be an array');
    await fs.unlink(result.outputPath).catch(() => {});
  });
});
