import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { pack } from '../core/packer.js';
import { cloneRemote, getDiffFiles } from '../core/gitOps.js';
import { listPromptTemplates } from '../prompts/templates.js';
import { countFileTokens, estimateCost } from '../core/tokenCount.js';
import { formatLanguageStats } from '../core/languageStats.js';
import { formatImportanceRanking } from '../core/importanceRanker.js';
import { formatDependencyGraph } from '../core/dependencyGraph.js';
import clipboardy from 'clipboardy';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const VERSION = '1.0.0';

export async function run() {
  const program = new Command();

  program
    .name('repogrok')
    .description('Pack your codebase into a single AI-friendly file')
    .version(VERSION)
    .argument('[paths...]', 'Path(s) to repository (supports multiple)', ['.'])
    .option('-o, --output <file>', 'Output file path')
    .option('-s, --style <format>', 'Output format: xml, markdown, json, plain', 'xml')
    .option('--include <patterns>', 'Include file patterns (comma-separated)')
    .option('--ignore <patterns>', 'Ignore file patterns (comma-separated)')
    .option('--remote <url>', 'Pack a remote repository (GitHub URL or owner/repo)')
    .option('--remote-branch <branch>', 'Branch for remote repository')
    .option('--diff', 'Only pack files changed since last commit')
    .option('--include-logs [count]', 'Include git commit log')
    .option('--prompt <template>', 'Inject prompt template (code-review, refactor, document, security, onboard, test, migrate)')
    .option('--cost', 'Show LLM cost estimates')
    .option('--copy', 'Copy output to clipboard')
    .option('--line-numbers', 'Add line numbers to file contents')
    .option('--remove-comments', 'Strip comments from source files')
    .option('--remove-empty-lines', 'Remove empty lines')
    .option('--no-security', 'Disable secret detection')
    .option('--list-prompts', 'List available prompt templates')
    .option('--init', 'Create a repogrok.config.json file')
    .option('--budget <tokens>', 'Context budget optimizer (e.g. "128k", "200k", "1m")')
    .option('--top <n>', 'Show top N most imported files')
    .option('--deps', 'Include dependency graph in output')
    .option('--stdin', 'Read file paths from stdin')
    .option('--watch', 'Re-pack on file changes')
    .option('--instruction <text>', 'Custom instruction text for AI')
    .option('--stats', 'Show language statistics in CLI output')
    .option('--mcp', 'Start as MCP server (placeholder)')
    .action(async (paths, options) => {
      // List prompts
      if (options.listPrompts) {
        console.log(chalk.bold('\nAvailable prompt templates:\n'));
        for (const name of listPromptTemplates()) {
          console.log(`  ${chalk.cyan(name)}`);
        }
        console.log(`\nUsage: repogrok --prompt ${chalk.cyan('<template-name>')}\n`);
        return;
      }

      // Init config
      if (options.init) {
        const configContent = JSON.stringify({
          include: [],
          ignore: { customPatterns: [] },
          output: { style: 'xml', filePath: 'repogrok-output.xml' },
        }, null, 2);
        await fs.writeFile('repogrok.config.json', configContent, 'utf-8');
        console.log(chalk.green('Created repogrok.config.json'));
        return;
      }

      // MCP server placeholder
      if (options.mcp) {
        console.log(chalk.bold('\nMCP Server Mode'));
        console.log(chalk.gray('  This is a placeholder for the Model Context Protocol server.'));
        console.log(chalk.gray('  MCP integration will allow external tools to request repository context.'));
        console.log(chalk.gray('  A future release will implement the full MCP server spec.\n'));
        console.log(chalk.cyan('  Available MCP tools (planned):'));
        console.log(chalk.gray('    - repogrok.pack: Pack a repository and return context'));
        console.log(chalk.gray('    - repogrok.search: Search files in a repository'));
        console.log(chalk.gray('    - repogrok.stats: Get repository language statistics'));
        console.log(chalk.gray('    - repogrok.deps: Get dependency graph'));
        console.log(chalk.gray('    - repogrok.rank: Get file importance ranking\n'));
        return;
      }

      // Stdin support: read file paths from stdin
      if (options.stdin) {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin });
        const lines = [];
        for await (const line of rl) {
          if (line.trim() && !line.startsWith('#')) lines.push(line.trim());
        }
        if (lines.length > 0) {
          options.include = lines.join(',');
        }
      }

      // Multi-path support: resolve the paths array
      const targetPaths = paths.length > 0 ? paths : ['.'];

      // Watch mode
      if (options.watch) {
        console.log(chalk.cyan('\n  Watching for changes... (Ctrl+C to stop)\n'));

        const runPack = async () => {
          for (const targetPath of targetPaths) {
            await executePack(targetPath, options, true);
          }
        };

        // Initial run
        await runPack();

        // Watch each path
        const { watch } = await import('fs');
        const watchers = [];
        let debounceTimer = null;

        for (const targetPath of targetPaths) {
          const resolved = path.resolve(targetPath);
          try {
            const watcher = watch.call(null, resolved, { recursive: true }, (eventType, filename) => {
              if (
                filename &&
                !filename.includes('repogrok-output') &&
                !filename.includes('node_modules') &&
                !filename.startsWith('.')
              ) {
                console.log(chalk.gray(`  Changed: ${filename}`));
                // Debounce re-pack
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                  console.log(chalk.cyan('\n  Re-packing...\n'));
                  await runPack();
                }, 300);
              }
            });
            watchers.push(watcher);
          } catch (err) {
            console.error(chalk.yellow(`  Warning: Could not watch ${resolved}: ${err.message}`));
          }
        }

        // Keep the process alive
        await new Promise(() => {});
        return;
      }

      // Normal mode: pack each path
      for (let i = 0; i < targetPaths.length; i++) {
        const targetPath = targetPaths[i];
        if (targetPaths.length > 1) {
          console.log(chalk.bold(`\n--- Repository ${i + 1}/${targetPaths.length}: ${targetPath} ---\n`));
        }
        await executePack(targetPath, options, false);
      }
    });

  await program.parseAsync(process.argv);
}

async function executePack(targetPath, options, isWatch) {
  const spinner = isWatch ? null : ora('Packing repository...').start();

  try {
    let packPath = targetPath;
    let tmpDir = null;

    // Handle remote
    if (options.remote) {
      if (spinner) spinner.text = 'Cloning remote repository...';
      let url = options.remote;
      if (!url.includes('://') && !url.includes('@')) {
        url = `https://github.com/${url}.git`;
      }
      tmpDir = await cloneRemote(url, options.remoteBranch);
      packPath = tmpDir;
    }

    // Handle diff mode
    if (options.diff) {
      const diffFiles = await getDiffFiles(path.resolve(packPath));
      if (diffFiles.length === 0) {
        if (spinner) spinner.info('No changed files found.');
        else console.log(chalk.gray('  No changed files found.'));
        return;
      }
      options.include = diffFiles.join(',');
      if (spinner) spinner.text = `Packing ${diffFiles.length} changed files...`;
    }

    if (spinner) spinner.text = 'Scanning files...';
    const result = await pack(packPath, options);

    if (spinner) {
      spinner.succeed(chalk.green('Repository packed successfully!'));
    } else {
      console.log(chalk.green('  Repository packed successfully!'));
    }

    // Summary
    console.log('');
    console.log(chalk.bold('  Output:    ') + chalk.cyan(result.outputPath));
    console.log(chalk.bold('  Files:     ') + result.totalFiles);
    console.log(chalk.bold('  Characters:') + ` ${result.totalCharacters.toLocaleString()}`);
    console.log(chalk.bold('  Tokens:    ') + `~${result.totalTokens.toLocaleString()}`);

    // Budget result
    if (result.budgetResult) {
      console.log('');
      console.log(chalk.bold('  Budget Optimization:'));
      console.log(chalk.bold('    Used tokens: ') + `~${result.budgetResult.usedTokens.toLocaleString()}`);
      console.log(chalk.bold('    Total tokens:') + ` ~${result.budgetResult.totalTokens.toLocaleString()}`);
      console.log(chalk.bold('    Dropped:     ') + `${result.budgetResult.droppedFiles} file(s)`);
    }

    // Suspicious files warning
    if (result.suspiciousFiles.length > 0) {
      console.log('');
      console.log(chalk.yellow(`  Warning: ${result.suspiciousFiles.length} file(s) excluded due to detected secrets:`));
      for (const f of result.suspiciousFiles.slice(0, 5)) {
        console.log(chalk.yellow(`    - ${f.path} (${f.reasons.join(', ')})`));
      }
      if (result.suspiciousFiles.length > 5) {
        console.log(chalk.yellow(`    ... and ${result.suspiciousFiles.length - 5} more`));
      }
    }

    // Language stats
    if (options.stats && result.languageStats) {
      console.log('');
      console.log(chalk.bold('  Language Statistics:\n'));
      const statsOutput = formatLanguageStats(result.languageStats);
      for (const line of statsOutput.split('\n')) {
        if (line.trim()) console.log(`    ${line}`);
      }
    }

    // Top imported files
    if (options.top && result.importanceRanking) {
      const topN = parseInt(options.top, 10) || 10;
      console.log('');
      console.log(chalk.bold(`  Top ${topN} Most Imported Files:\n`));
      const rankOutput = formatImportanceRanking(result.importanceRanking, topN);
      for (const line of rankOutput.split('\n')) {
        if (line.trim()) console.log(`    ${line}`);
      }
    }

    // Dependency graph (CLI display)
    if (options.deps && result.dependencyGraph) {
      console.log('');
      console.log(chalk.bold('  Dependency Graph:\n'));
      const depsOutput = formatDependencyGraph(result.dependencyGraph);
      for (const line of depsOutput.split('\n')) {
        if (line.trim()) console.log(`    ${line}`);
      }
    }

    // Cost estimates
    if (options.cost) {
      console.log('');
      console.log(chalk.bold('  LLM Cost Estimates (input):'));
      for (const [model, info] of Object.entries(result.costEstimate)) {
        const fits = info.fitsInContext ? chalk.green('fits') : chalk.red('exceeds context');
        console.log(`    ${chalk.cyan(model.padEnd(22))} ${info.estimatedCost.padEnd(10)} (${info.contextWindow} context - ${fits})`);
      }
    }

    // Copy to clipboard
    if (options.copy) {
      const content = await fs.readFile(result.outputPath, 'utf-8');
      await clipboardy.write(content);
      console.log(chalk.green('\n  Copied to clipboard!'));
    }

    console.log('');

    // Cleanup remote tmp
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

  } catch (err) {
    if (spinner) {
      spinner.fail(chalk.red('Failed to pack repository'));
    }
    console.error(chalk.red(`\n  ${err.message}`));
    if (!isWatch) {
      process.exit(1);
    }
  }
}
