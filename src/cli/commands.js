import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { pack } from '../core/packer.js';
import { cloneRemote, getDiffFiles } from '../core/gitOps.js';
import { listPromptTemplates } from '../prompts/templates.js';
import { countFileTokens, estimateCost } from '../core/tokenCount.js';
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
    .argument('[path]', 'Path to repository', '.')
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
    .action(async (targetPath, options) => {
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

      const spinner = ora('Packing repository...').start();

      try {
        let packPath = targetPath;
        let tmpDir = null;

        // Handle remote
        if (options.remote) {
          spinner.text = 'Cloning remote repository...';
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
            spinner.info('No changed files found.');
            return;
          }
          options.include = diffFiles.join(',');
          spinner.text = `Packing ${diffFiles.length} changed files...`;
        }

        spinner.text = 'Scanning files...';
        const result = await pack(packPath, options);

        spinner.succeed(chalk.green('Repository packed successfully!'));

        // Summary
        console.log('');
        console.log(chalk.bold('  Output:    ') + chalk.cyan(result.outputPath));
        console.log(chalk.bold('  Files:     ') + result.totalFiles);
        console.log(chalk.bold('  Characters:') + ` ${result.totalCharacters.toLocaleString()}`);
        console.log(chalk.bold('  Tokens:    ') + `~${result.totalTokens.toLocaleString()}`);

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
        spinner.fail(chalk.red('Failed to pack repository'));
        console.error(chalk.red(`\n  ${err.message}`));
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}
